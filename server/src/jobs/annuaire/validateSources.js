const { oleoduc, writeData } = require("oleoduc");
const luhn = require("fast-luhn");
const logger = require("../../common/logger");
const ApiSirene = require("../../common/apis/ApiSirene");
const Cache = require("../../common/apis/Cache");
const { validateUAI } = require("../../common/utils/uaiUtils");

async function validateSource(source, cache, apiSirene) {
  let memo = new Set();
  let stats = {
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

  async function getEtablissementStatus(siret) {
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

  let input = await source.stream();
  await oleoduc(
    input,
    writeData(
      async (data) => {
        stats.total++;
        let uai = (data.uais || [])[0];
        let siret = data.selector || data.siret;
        logger.debug(`Validation de ${uai} ${siret}...`);

        if (uai) {
          stats.uais.total++;
          if (memo.has(uai)) {
            stats.uais.dupliqués++;
          } else {
            memo.add(uai);
            if (validateUAI(uai)) {
              stats.uais.valides++;
            } else {
              stats.uais.invalides++;
            }
          }
        } else {
          stats.uais.absents++;
        }

        if (siret) {
          stats.sirets.total++;
          if (memo.has(siret)) {
            stats.sirets.dupliqués++;
          } else {
            memo.add(siret);
            let status = await getEtablissementStatus(siret);
            stats.sirets[status]++;
          }
        } else {
          stats.sirets.absents++;
        }
        logger.debug(`Statut validation`, { source: source.name, ...stats });
      },
      { parallel: 5 }
    )
  );

  return stats;
}

module.exports = async (sources) => {
  let cache = new Cache("siret");
  return sources.reduce(async (acc, source) => {
    return {
      ...(await acc),
      [source.name]: await validateSource(source, cache, new ApiSirene()),
    };
  }, Promise.resolve({}));
};
