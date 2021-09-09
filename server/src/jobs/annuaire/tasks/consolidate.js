const logger = require("../../../common/logger");
const { Annuaire } = require("../../../common/model");

async function validateUAI() {
  let stats = {
    validated: 0,
    conflicted: 0,
  };

  function withPopularUAIAndSources(uai) {
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
  }

  function handleAnomalies(etablissement, mostPopularUAI, nbConflicts) {
    logger.warn(
      `Impossible de valider l'UAI ${mostPopularUAI} pour l'établissement ${etablissement.siret}` +
        ` car il est en conflict avec ${nbConflicts} autres établissements`
    );

    return Annuaire.updateOne(
      { siret: etablissement.siret },
      {
        $push: {
          "_meta.anomalies": {
            $each: [
              {
                job: "consolidate",
                source: "annuaire",
                date: new Date(),
                code: "conflit_uai",
                details: `UAI ${mostPopularUAI} en conflict avec ${nbConflicts} autres établissements`,
              },
            ],
            $slice: 10,
            $sort: { date: -1 },
          },
        },
      },
      { runValidators: true }
    );
  }

  await Annuaire.find({
    uai: { $exists: false },
    ...withPopularUAIAndSources(),
  })
    .lean()
    .cursor()
    .eachAsync(async (etablissement) => {
      let mostPopularUAI = etablissement.uais.reduce((acc, u) => {
        let filterSources = (array) => array.filter((s) => ["deca", "sifa-ramsese", "catalogue"].includes(s));
        return filterSources(acc.sources).length < filterSources(u.sources).length ? u : acc;
      }).uai;

      let nbConflicts = await Annuaire.count({
        siret: { $ne: etablissement.siret },
        ...withPopularUAIAndSources(mostPopularUAI),
      });

      if (nbConflicts === 0) {
        logger.info(`UAI ${mostPopularUAI} validé pour l'établissement ${etablissement.siret}`);
        await Annuaire.updateMany({ siret: etablissement.siret }, { $set: { uai: mostPopularUAI } });
        stats.validated++;
      } else {
        stats.conflicted++;
        await handleAnomalies(etablissement, mostPopularUAI, nbConflicts);
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
