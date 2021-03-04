const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const apiEsSup = require("../../../common/apis/apiEsSup");
const logger = require("../../../common/logger");

class Cache {
  constructor(cacheName) {
    this.name = cacheName;
    this.cache = {};
  }

  get(key) {
    return this.cache[key];
  }

  add(key, value) {
    logger.debug(`Key '${key}' added to cache ${this.name}`);
    this.cache[key] = value;
  }

  flush() {
    logger.debug(`Cache '${this.name} ' flushed`);
    this.cache = {};
  }
}

module.exports = async (options = {}) => {
  let api = options.apiEsSup || apiEsSup;
  let filters = options.filters || {};
  let cache = new Cache("academie");

  let stream = oleoduc(
    Annuaire.find({ ...filters, $and: [{ adresse: { $exists: true } }, { adresse: { $ne: null } }] }).cursor(),
    transformData(async (etablissement) => {
      let siret = etablissement.siret;
      let codeInsee = etablissement.adresse.code_insee;

      try {
        let records = cache.get(codeInsee);
        if (!records) {
          let fetched = await api.fetchInfoFromCodeCommune(codeInsee);
          records = fetched.records;
          cache.add(codeInsee, records);
        }

        let data = records.length > 0 ? records[0].fields : null;

        return {
          siret,
          ...(data
            ? {
                data: {
                  academie: {
                    code: data.aca_code,
                    nom: data.aca_nom,
                  },
                },
              }
            : {
                anomalies: [`Impossible de déterminer l'académie pour le code insee ${codeInsee}`],
              }),
        };
      } catch (e) {
        return { siret, anomalies: [e] };
      }
    }),
    { promisify: false, parallel: 5 }
  );

  stream.on("finish", () => cache.flush());

  return stream;
};
