const { oleoduc, writeData } = require("oleoduc");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

const shouldAddUAIs = (etablissement, uai) => {
  return uai && etablissement.uai !== uai && !etablissement.uaisSecondaires.find((sec) => sec.uai === uai);
};

module.exports = async (source) => {
  let type = source.type;
  let stats = {
    total: 0,
    updated: 0,
    failed: 0,
  };

  let handleError = async (error, siret) => {
    stats.failed++;
    logger.error(`[Collect][${type}] Erreur lors de la collecte pour l'établissement ${siret}.`, error);
    await Annuaire.updateOne(
      { siret },
      {
        $push: {
          "_meta.anomalies": {
            $each: [{ type: "collect", source: source.type, reason: error.message || error, date: new Date() }],
            // Max 10 elements ordered by date
            $slice: 10,
            $sort: { date: -1 },
          },
        },
      },
      { runValidators: true }
    );
  };

  try {
    await oleoduc(
      source,
      writeData(async ({ siret, error, data }) => {
        stats.total++;
        if (error) {
          await handleError(error, siret);
          return;
        }

        try {
          let etablissement = await Annuaire.findOne({ siret });
          if (!etablissement) {
            return;
          }

          let { uai, ...rest } = data;
          let res = await Annuaire.updateOne(
            { siret },
            {
              $set: {
                ...rest,
              },
              ...(shouldAddUAIs(etablissement, uai)
                ? {
                    $push: {
                      uaisSecondaires: { type, uai, valide: validateUAI(uai) },
                    },
                  }
                : {}),
            },
            { runValidators: true }
          );
          stats.updated += getNbModifiedDocuments(res);
        } catch (e) {
          await handleError(e, siret);
        }
      })
    );
  } catch (e) {
    stats.failed++;
    logger.error(`[Collect][${type}] Erreur lors de la collecte.`, e);
  }
  return stats;
};
