const { oleoduc, writeData } = require("oleoduc");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

const shouldAddUAI = (etablissement, uai) => {
  return uai && etablissement.uai !== uai && !etablissement.uais_secondaires.find((sec) => sec.uai === uai);
};

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
      writeData(async ({ siret, anomalies = [], uais = [], data }) => {
        stats.total++;

        try {
          let etablissement = await Annuaire.findOne({ siret });
          if (!etablissement) {
            return;
          }

          if (anomalies.length > 0) {
            await handleAnomalies(siret, anomalies);
          }

          if (data || uais.length > 0) {
            let res = await Annuaire.updateOne(
              { siret },
              {
                $set: data || {},
                ...(uais.length === 0
                  ? {}
                  : {
                      $push: {
                        uais_secondaires: {
                          $each: uais
                            .filter((uai) => shouldAddUAI(etablissement, uai))
                            .map((uai) => {
                              return { type, uai, valide: validateUAI(uai) };
                            }),
                        },
                      },
                    }),
              },
              { runValidators: true }
            );
            stats.updated += getNbModifiedDocuments(res);
          }
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
