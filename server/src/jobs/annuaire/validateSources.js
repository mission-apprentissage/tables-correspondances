const { oleoduc, writeData } = require("oleoduc");
const luhn = require("fast-luhn");
const mergeStream = require("merge-stream");
const logger = require("../../common/logger");
const ApiSirene = require("../../common/apis/ApiSirene");
const Cache = require("../../common/apis/Cache");
const { validateUAI } = require("../../common/utils/uaiUtils");

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
      dupliqués: 0,
      fermés: 0,
      inconnus: 0,
      absents: 0,
      invalides: 0,
      erreurs: 0,
    },
    uais: {
      total: 0,
      valides: 0,
      dupliqués: 0,
      absents: 0,
      invalides: 0,
    },
  };
}

async function validateSources(sources) {
  let memo = new Set();
  let apiSirene = new ApiSirene();
  let cache = new Cache("siret");
  let stats = {};

  let streams = await Promise.all(sources.map((source) => source.stream()));

  await oleoduc(
    mergeStream(streams),
    writeData(
      async ({ from, selector: siret, uais = [] }) => {
        stats[from] = stats[from] || createSourceStats();
        stats[from].total++;
        let uai = uais[0];
        logger.debug(`Validation de ${uai} ${siret}...`);

        if (uai) {
          stats[from].uais.total++;
          if (memo.has(uai)) {
            stats[from].uais.dupliqués++;
          } else {
            memo.add(uai);
            if (validateUAI(uai)) {
              stats[from].uais.valides++;
            } else {
              stats[from].uais.invalides++;
            }
          }
        } else {
          stats[from].uais.absents++;
        }

        if (siret) {
          stats[from].sirets.total++;
          if (memo.has(siret)) {
            stats[from].sirets.dupliqués++;
          } else {
            memo.add(siret);
            let status = await getEtablissementStatus(siret, cache, apiSirene);
            stats[from].sirets[status]++;
          }
        } else {
          stats[from].sirets.absents++;
        }
      },
      { parallel: 5 }
    )
  );

  return stats;
}

module.exports = validateSources;
