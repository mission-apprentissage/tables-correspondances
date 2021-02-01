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

  let handleError = (e, options) => {
    stats.failed++;
    let extra = options ? `[${JSON.stringify(options)}]` : "";
    logger.error(`Unable to collect informations for source '${source.type}' ${extra}`, e);
  };

  await oleoduc(
    source,
    writeData(async (current) => {
      let siret = current.siret;
      stats.total++;

      try {
        if (current.error instanceof Error) {
          return handleError(current.error);
        }

        let etablissement = await Annuaire.findOne({ siret: siret });
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
        handleError(e, siret);
      }
    })
  );

  return stats;
};
