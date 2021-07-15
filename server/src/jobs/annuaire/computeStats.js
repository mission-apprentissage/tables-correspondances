const { AnnuaireStats } = require("../../common/model");
const { oleoduc, writeData } = require("oleoduc");
const luhn = require("fast-luhn");
const { intersection, union, range, uniq } = require("lodash");
const mergeStream = require("merge-stream");
const logger = require("../../common/logger");
const ApiSirene = require("../../common/apis/ApiSirene");
const Cache = require("../../common/apis/Cache");
const { validateUAI } = require("../../common/utils/uaiUtils");
const { getMongooseInstance } = require("../../common/mongodb");

// eslint-disable-next-line no-unused-vars
async function validateSiretWithApi(siret, cache, apiSirene) {
  if (!luhn(siret)) {
    return { isValid: false, category: "invalides" };
  }

  try {
    let etat_administratif = await cache.memo(siret, async () => {
      let { etat_administratif } = await apiSirene.getEtablissement(siret);
      return etat_administratif;
    });

    return { isValid: true, category: etat_administratif === "A" ? "actifs" : "fermés" };
  } catch (e) {
    if (e.reason === 404) {
      return { isValid: false, category: "invalides" };
    }

    logger.error(e);
    return { isValid: false, category: "erreurs" };
  }
}

// eslint-disable-next-line no-unused-vars
async function validateSiret(siret) {
  let found = await getMongooseInstance().connection.db.collection("sirene").findOne({ siret });
  if (!luhn(siret) || !found) {
    return { isValid: false, category: "invalides" };
  }

  return { isValid: true, category: found.etatAdministratifEtablissement === "A" ? "actifs" : "fermés" };
}

function buildMatrice(valides, field) {
  return Object.keys(valides).reduce((matrice, sourceName) => {
    let values = Array.from(valides[sourceName][field]);
    let otherSourceNames = Object.keys(valides).filter((name) => name !== sourceName);

    return {
      ...matrice,
      [sourceName]: otherSourceNames.reduce((acc, otherSourceName) => {
        let otherValues = Array.from(valides[otherSourceName][field]);

        return {
          ...acc,
          [sourceName]: {
            intersection: values.length,
            union: values.length,
          },
          [otherSourceName]: {
            intersection: intersection(values, otherValues).length,
            union: union(values, otherValues).length,
          },
        };
      }, {}),
    };
  }, {});
}

function buildRecoupement(valides, field) {
  let data = Object.keys(valides).reduce((acc, sourceName) => {
    valides[sourceName][field].forEach((value) => {
      let found = acc.find((a) => a.value === value);
      if (found) {
        found.sources = uniq([...(found.sources || []), sourceName]);
      } else {
        acc.push({
          value,
          sources: [sourceName],
        });
      }
    });
    return acc;
  }, []);

  return {
    total: data.length,
    ...range(1, Object.keys(valides).length + 1).reduce((acc, index) => {
      return {
        ...acc,
        [index]: data.filter((u) => u.sources.length === index).length,
      };
    }, {}),
  };
}

async function validateSources(sources) {
  let apiSirene = new ApiSirene();
  let cache = new Cache("siret");
  let validation = {};
  let valides = {};
  let createSourceUniques = () => ({ uais: new Set(), sirets: new Set(), uais_sirets: new Set() });
  let createSourceStats = () => ({
    total: 0,
    sirets: {
      actifs: 0,
      fermés: 0,
      invalides: 0,
      absents: 0,
      erreurs: 0,
      uniques: 0,
      dupliqués: 0,
    },
    uais: {
      valides: 0,
      absents: 0,
      invalides: 0,
      uniques: 0,
      dupliqués: 0,
    },
  });

  let streams = await Promise.all(sources.map((source) => source.stream()));

  await oleoduc(
    mergeStream(streams),
    writeData(
      async ({ from, selector: siret, uais = [] }) => {
        let uai = uais[0];
        let isUaiValide = false;
        let isSiretValide = false;
        valides[from] = valides[from] || createSourceUniques();
        validation[from] = validation[from] || createSourceStats();
        validation[from].total++;

        logger.debug(`Validation de ${uai} ${siret}...`);

        if (uai) {
          if (validateUAI(uai)) {
            isUaiValide = true;
            validation[from].uais.valides++;
            if (valides[from].uais.has(uai)) {
              validation[from].uais.dupliqués++;
            } else {
              valides[from].uais.add(uai);
              validation[from].uais.uniques++;
            }
          } else {
            validation[from].uais.invalides++;
          }
        } else {
          validation[from].uais.absents++;
        }

        if (siret) {
          let { isValid, category } = await validateSiretWithApi(siret, cache, apiSirene);
          validation[from].sirets[category]++;
          if (isValid) {
            isSiretValide = true;
            if (valides[from].sirets.has(siret)) {
              validation[from].sirets.dupliqués++;
            } else {
              valides[from].sirets.add(siret);
              validation[from].sirets.uniques++;
            }
          }
        } else {
          validation[from].sirets.absents++;
        }

        if (isUaiValide && isSiretValide) {
          valides[from].uais_sirets.add(`${uai}_${siret}`);
        }
      },
      { parallel: 5 }
    )
  );

  return { validation, valides };
}

async function computeStats(sources, options) {
  let { validation, valides } = await validateSources(sources);

  let stats = {
    validation,
    matrices: {
      uais: buildMatrice(valides, "uais"),
      sirets: buildMatrice(valides, "sirets"),
      uais_sirets: buildMatrice(valides, "uais_sirets"),
    },
    recoupements: {
      uais: buildRecoupement(valides, "uais"),
      sirets: buildRecoupement(valides, "sirets"),
      uais_sirets: buildRecoupement(valides, "uais_sirets"),
    },
  };

  if (options.save) {
    await AnnuaireStats.create(stats);
  }

  return stats;
}
module.exports = computeStats;
