const { AnnuaireStats } = require("../../common/model");
const validateSources = require("./validateSources");
const buildMatrice = require("./buildMatrice");
const datagouv = require("./referentiels/datagouv");

async function computeStats(sources) {
  let referentiel = await datagouv();

  let stats = {
    validation: await validateSources(sources),
    matrices: {
      uai_siret: await buildMatrice(sources, ["uai", "siret"]),
      uai: await buildMatrice(sources, ["uai"]),
      siret: await buildMatrice([...sources, referentiel.asSource()], ["siret"]),
    },
  };

  await AnnuaireStats.create(stats);

  return stats;
}
module.exports = computeStats;
