const logger = require("../../common/logger");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");

async function validateUAI() {
  let stats = {
    validated: 0,
    removed: 0,
    conflicted: 0,
  };
  let validableOnlyQuery = (uai) => {
    let uaiFilter = uai ? { uai } : {};
    return {
      $or: [
        { uais: { $elemMatch: { sources: { $all: ["deca", "sifa-ramsese", "catalogue"] }, ...uaiFilter } } },
        {
          uais: { $elemMatch: { sources: { $all: ["deca", "sifa-ramsese"] }, ...uaiFilter } },
          "uais.sources": { $ne: "catalogue" },
        },
      ],
    };
  };

  await Annuaire.find({
    uai: { $exists: false },
    ...validableOnlyQuery(),
  })
    .lean()
    .cursor()
    .eachAsync(async (etablissement) => {
      let mostPopularUAI = etablissement.uais.reduce((acc, u) => (acc.sources.length < u.sources.length ? u : acc)).uai;
      let nbConflicts = await Annuaire.count({
        siret: { $ne: etablissement.siret },
        ...validableOnlyQuery(mostPopularUAI),
      });

      if (nbConflicts === 0) {
        logger.info(`UAI ${mostPopularUAI} validé pour l'établissement ${etablissement.siret}`);
        await Annuaire.update({ siret: etablissement.siret }, { $set: { uai: mostPopularUAI } });
        stats.validated++;

        let res = await Annuaire.updateMany(
          { siret: { $ne: etablissement.siret }, "uais.uai": mostPopularUAI },
          { $pull: { uais: { uai: mostPopularUAI } } }
        );
        let nbModifiedDocuments = getNbModifiedDocuments(res);
        if (nbModifiedDocuments) {
          stats.removed += nbModifiedDocuments;
        }
      } else {
        logger.warn(
          `Impossible de valider l'UAI ${mostPopularUAI} pour l'établissement ${etablissement.siret}` +
            ` car il est en conflict avec ${nbConflicts} autres établissements`
        );
        stats.conflicted++;
      }
    });

  return stats;
}

async function consolidate() {
  return {
    validateUAI: await validateUAI(),
  };
}

module.exports = consolidate;
