const { oleoduc, writeData } = require("oleoduc");
const luhn = require("fast-luhn");
const { uniq } = require("lodash");
const mergeStream = require("merge-stream");
const logger = require("../../../common/logger");
const ApiSirene = require("../../../common/apis/ApiSirene");
const Cache = require("../../../common/apis/Cache");
const { validateUAI } = require("../../../common/utils/uaiUtils");

async function getEtablissementStatus(siret, cache, apiSirene) {
  if (!luhn(siret)) {
    return "invalides";
  }

  try {
    let etat_administratif = await cache.memo(siret, async () => {
      let { etat_administratif } = await apiSirene.getEtablissement(siret);
      return etat_administratif;
    });

    if (etat_administratif === "A") {
      return "valides";
    }
    return "fermés";
  } catch (e) {
    if (e.reason === 404) {
      return "inconnus";
    }

    logger.error(e);
    return "erreurs";
  }
}

function createSourceStats() {
  return {
    total: 0,
    sirets: {
      total: 0,
      valides: 0,
      fermés: 0,
      absents: 0,
      invalides: 0,
      uniques: 0,
      dupliqués: 0,
      erreurs: 0,
    },
    uais: {
      total: 0,
      valides: 0,
      absents: 0,
      invalides: 0,
      uniques: 0,
      dupliqués: 0,
    },
  };
}

function createSourceMemo() {
  return { uais: new Set(), sirets: new Set() };
}

async function validateSources(sources) {
  let apiSirene = new ApiSirene();
  let cache = new Cache("siret");
  let stats = { global: { nbUaiUniques: 0, nbSiretUniques: 0 }, sources: {} };
  let memo = {};

  let streams = await Promise.all(sources.map((source) => source.stream()));

  await oleoduc(
    mergeStream(streams),
    writeData(
      async ({ from, selector: siret, uais = [] }) => {
        stats.sources[from] = stats.sources[from] || createSourceStats();
        memo[from] = memo[from] || createSourceMemo();
        stats.sources[from].total++;
        let uai = uais[0];
        logger.debug(`Validation de ${uai} ${siret}...`);

        if (uai) {
          stats.sources[from].uais.total++;

          if (validateUAI(uai)) {
            stats.sources[from].uais.valides++;
            if (memo[from].uais.has(uai)) {
              stats.sources[from].uais.dupliqués++;
            } else {
              memo[from].uais.add(uai);
              stats.sources[from].uais.uniques++;
            }
          } else {
            stats.sources[from].uais.invalides++;
          }
        } else {
          stats.sources[from].uais.absents++;
        }

        if (siret) {
          stats.sources[from].sirets.total++;
          let status = await getEtablissementStatus(siret, cache, apiSirene);
          stats.sources[from].sirets[status]++;
          if (status === "valides") {
            if (memo[from].sirets.has(siret)) {
              stats.sources[from].sirets.dupliqués++;
            } else {
              memo[from].sirets.add(siret);
              stats.sources[from].sirets.uniques++;
            }
          }
        } else {
          stats.sources[from].sirets.absents++;
        }
      },
      { parallel: 5 }
    )
  );

  stats.global.nbUaiUniques = uniq(Object.keys(memo).reduce((acc, key) => [...acc, ...memo[key].uais], [])).length;
  stats.global.nbSiretUniques = uniq(Object.keys(memo).reduce((acc, key) => [...acc, ...memo[key].sirets], [])).length;
  return stats;
}

module.exports = validateSources;
