const { oleoduc, writeData } = require("oleoduc");
const { omit } = require("lodash");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

const shouldIgnoreUAIs = (etablissement, data) => {
  return (
    !data.uai || etablissement.uai === data.uai || !!etablissement.uais_secondaires.find(({ uai }) => uai === data.uai)
  );
};
module.exports = async (source) => {
  let stats = {
    total: 0,
    updated: 0,
    failed: 0,
  };

  await oleoduc(
    source,
    writeData(async (current) => {
      try {
        stats.total++;

        let etablissement = await Annuaire.findOne({ siret: current.siret });
        if (!etablissement) {
          return;
        }

        let res = await Annuaire.updateOne(
          { _id: etablissement._id },
          {
            $set: {
              ...omit(current, ["uai", "siret", "nom"]),
            },
            ...(shouldIgnoreUAIs(etablissement, current)
              ? {}
              : {
                  $push: {
                    uais_secondaires: { type: source.type, uai: current.uai, valide: validateUAI(current.uai) },
                  },
                }),
          }
        );
        stats.updated += getNbModifiedDocuments(res);
      } catch (e) {
        stats.failed++;
        logger.error(`Unable to add UAI informations for siret ${current.siret}`, e);
      }
    })
  );

  return stats;
};
