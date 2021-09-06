const ApiGeoAdresse = require("../../common/apis/ApiGeoAdresse");
const { createSource } = require("./sources/sources");
const collectSources = require("./tasks/collectSources");
const consolidate = require("./tasks/consolidate");
const importReferentiel = require("./importReferentiel");
const { createReferentiel } = require("./referentiels/referentiels");
const clearAnnuaire = require("./clearAnnuaire");

async function rebuild(options) {
  let apiGeoAdresse = new ApiGeoAdresse(); //Allow all sources to share the same api instance (ie. rate limit)
  let stats = [];

  await clearAnnuaire().then((res) => stats.push({ clean: res }));

  await importReferentiel(createReferentiel("gof")).then((res) => stats.push({ referentiel: res }));

  await collectSources(
    [
      createSource("agri"),
      createSource("anasup"),
      createSource("compagnons-du-devoir"),
      createSource("deca"),
      createSource("catalogue"),
      createSource("gesti"),
      createSource("ideo2"),
      createSource("onisep"),
      createSource("onisep-structure"),
      createSource("opcoep"),
      createSource("promotrans"),
      createSource("sifa-ramsese"),
      createSource("depp"),
      createSource("refea"),
      createSource("sirene", { apiGeoAdresse }),
      createSource("formations", { apiGeoAdresse }),
      createSource("ymag"),
      createSource("acce"),
    ],
    options
  ).then((res) => stats.push({ collect: res }));

  await consolidate().then((res) => stats.push({ consolidation: res }));

  await collectSources(
    [
      //Theses sources used uai as selector, so we tried to collect as many uais as possible before running them
      createSource("ccca-btp"),
      createSource("cci-france"),
      createSource("cma"),
    ],
    options
  ).then((res) => stats.push({ collect: res }));

  return stats;
}

module.exports = rebuild;
