const { oleoduc, writeData } = require("oleoduc");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

function getUAIsSecondaires(type, etablissement, uais) {
  return uais
    .filter((uai) => uai && uai !== "NULL" && etablissement.uai !== uai)
    .map((uai) => {
      return { type, uai, valide: validateUAI(uai) };
    });
}

function getRelations(type, etablissement, relations) {
  let previousRelations = etablissement.relations.map((relation) => {
    let found = relations.find((r) => r.siret === relation.siret);
    return found ? { ...found, ...relation, sources: [...relation.sources, type] } : relation;
  });

  let newRelations = relations
    .filter((r) => !previousRelations.map((pr) => pr.siret).includes(r.siret))
    .map((r) => {
      return { ...r, sources: [type] };
    });

  return [...previousRelations, ...newRelations];
}

module.exports = async (source) => {
  let type = source.type;
  let stats = {
    total: 0,
    updated: 0,
    failed: 0,
  };

  async function handleAnomalies(siret, anomalies) {
    stats.failed++;
    logger.error(`[Collect][${type}] Erreur lors de la collecte pour l'établissement ${siret}.`, anomalies);
    await Annuaire.updateOne(
      { siret },
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
    await oleoduc(
      source,
      writeData(async ({ siret, uais = [], relations = [], reseaux = [], data = {}, anomalies = [] }) => {
        stats.total++;

        try {
          let etablissement = await Annuaire.findOne({ siret }).lean();
          if (!etablissement) {
            return;
          }

          if (anomalies.length > 0) {
            await handleAnomalies(siret, anomalies);
          }

          let res = await Annuaire.updateOne(
            { siret },
            {
              $set: {
                ...data,
                relations: getRelations(type, etablissement, relations),
              },
              $addToSet: {
                reseaux: {
                  $each: reseaux,
                },
                uais_secondaires: {
                  $each: getUAIsSecondaires(type, etablissement, uais),
                },
              },
            },
            { runValidators: true }
          );
          stats.updated += getNbModifiedDocuments(res);
        } catch (e) {
          await handleAnomalies(siret, [e]);
        }
      })
    );
  } catch (e) {
    stats.failed++;
    logger.error(`[Collect][${type}] Erreur lors de la collecte.`, e);
  }
  return stats;
};
