const ApiGeoAdresse = require("../../common/apis/ApiGeoAdresse");
const { createSource } = require("./sources/sources");
const collectSources = require("./tasks/collectSources");
const consolidate = require("./tasks/consolidate");
const importReferentiel = require("./importReferentiel");
const { createReferentiel } = require("./referentiels/referentiels");
const clearAnnuaire = require("./clearAnnuaire");

async function rebuild(options = {}) {
  let apiGeoAdresse = new ApiGeoAdresse(); //Allow all sources to share the same api instance (ie. rate limit)
  let stats = [];
  let collectAll = (sourceNames, bulkOptions = {}) => {
    let sources = sourceNames.map((sourceName) => createSource(sourceName, bulkOptions));
    return collectSources(sources, options).then((res) => stats.push({ collect: res }));
  };

  await clearAnnuaire().then((res) => stats.push({ clean: res }));

  await importReferentiel(createReferentiel("gof")).then((res) => stats.push({ referentiel: res }));

  await collectAll([
    "agri",
    "anasup",
    "compagnons-du-devoir",
    "deca",
    "catalogue",
    "gesti",
    "ideo2",
    "opcoep",
    "promotrans",
    "sifa-ramsese",
    "depp",
    "refea",
    "ymag",
    "acce",
  ]);

  await collectAll(["onisep", "onisep-structure"]);
  await collectAll(["sirene", "formations"], { apiGeoAdresse });

  await consolidate().then((res) => stats.push({ consolidation: res }));

  //Theses sources used uai as selector, so we need to consolidate UAI before running them
  await collectAll(["ccca-btp", "cci-france", "cma"]);

  return stats;
}

module.exports = rebuild;
