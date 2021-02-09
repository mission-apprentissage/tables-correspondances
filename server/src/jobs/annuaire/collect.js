const { oleoduc, writeData } = require("oleoduc");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

const shouldAddUAIs = (etablissement, uai) => {
  return uai && etablissement.uai !== uai && !etablissement.uais_secondaires.find((sec) => sec.uai === uai);
};

module.exports = async (source) => {
  let stats = {
    total: 0,
    updated: 0,
    failed: 0,
  };

  let handleError = (e, options) => {
    stats.failed++;
    let extra = options ? `[${JSON.stringify(options)}]` : "";
    logger.error(`Unable to collect informations for source '${source.type}' ${extra}`, e);
  };

  await oleoduc(
    source,
    writeData(async ({ siret, error, data }) => {
      stats.total++;
      if (error) {
        logger.error(`[Collect] Erreur lors de la collecte pour l'établissement ${siret}.`, error);
        stats.failed++;
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
                    uais_secondaires: { type: source.type, uai, valide: validateUAI(uai) },
                  },
                }
              : {}),
          },
          { runValidators: true }
        );
        stats.updated += getNbModifiedDocuments(res);
      } catch (e) {
        handleError(e, siret);
      }
    })
  );

  return stats;
};
