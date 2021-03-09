const { oleoduc, writeData, filterData } = require("oleoduc");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

function buildSelectorQuery(selector) {
  return { $or: [{ siret: selector }, { uai: selector }, { "uais_secondaires.uai": selector }] };
}

function buildNewUAIsSecondaires(type, etablissement, uais) {
  return uais
    .filter((uai) => uai && uai !== "NULL" && etablissement.uai !== uai)
    .map((uai) => {
      return { type, uai, valide: validateUAI(uai) };
    });
}

async function buildNewRelations(type, relations) {
  return Promise.all(
    relations.map(async (r) => {
      let doc = await Annuaire.findOne({ siret: r.siret });
      return { ...r, label: doc ? doc.raison_sociale : r.label, annuaire: !!doc, source: type };
    })
  );
}

module.exports = async (source, options = {}) => {
  let filters = options.filters || {};
  let type = source.type;
  let stats = {
    total: 0,
    updated: 0,
    failed: 0,
  };

  async function handleAnomalies(selector, anomalies) {
    stats.failed++;
    logger.error(`[Collect][${type}] Erreur lors de la collecte pour l'établissement ${selector}.`, anomalies);
    let query = buildSelectorQuery(selector);

    await Annuaire.updateOne(
      query,
      {
        $push: {
          "_meta.anomalies": {
            $each: anomalies.map((a) => ({
              type: "collect",
              source: source.type,
              date: new Date(),
              details: a.message || a,
            })),
            // Max 10 elements ordered by date
            $slice: 10,
            $sort: { date: -1 },
          },
        },
      },
      { runValidators: true }
    );
  }

  try {
    let stream = await source.stream({ filters });

    await oleoduc(
      stream,
      filterData((data) => {
        return filters.siret ? filters.siret === data.selector : !!data;
      }),
      writeData(async ({ selector, uais = [], relations = [], reseaux = [], data = {}, anomalies = [] }) => {
        stats.total++;
        let query = buildSelectorQuery(selector);

        try {
          let etablissement = await Annuaire.findOne(query).lean();
          if (!etablissement) {
            return;
          }

          if (anomalies.length > 0) {
            await handleAnomalies(selector, anomalies);
          }

          let res = await Annuaire.updateOne(
            query,
            {
              $set: {
                ...data,
              },
              $addToSet: {
                reseaux: {
                  $each: reseaux,
                },
                relations: {
                  $each: await buildNewRelations(type, relations),
                },
                uais_secondaires: {
                  $each: buildNewUAIsSecondaires(type, etablissement, uais),
                },
              },
            },
            { runValidators: true }
          );
          stats.updated += getNbModifiedDocuments(res);
          logger.info(`[Collect][${type}] Etablissement ${selector} updated`);
        } catch (e) {
          await handleAnomalies(selector, [e]);
        }
      })
    );
  } catch (e) {
    stats.failed++;
    logger.error(`[Collect][${type}] Erreur lors de la collecte.`, e);
  }
  return stats;
};
