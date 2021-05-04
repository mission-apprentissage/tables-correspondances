const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const ApiEsSup = require("../../../common/apis/ApiEsSup");
const Cache = require("../../../common/apis/Cache");

module.exports = async (custom = {}) => {
  let name = "academie";
  let api = custom.apiEsSup || new ApiEsSup();

  return {
    name,
    stream(options = {}) {
      let filters = options.filters || {};
      let cache = new Cache(name);

      let stream = oleoduc(
        Annuaire.find({ ...filters, $and: [{ adresse: { $exists: true } }, { adresse: { $ne: null } }] })
          .lean()
          .cursor(),
        transformData(
          async (etablissement) => {
            let siret = etablissement.siret;
            let codeInsee = etablissement.adresse.code_insee;

            try {
              let records = await cache.memo(codeInsee, async () => {
                let { records } = await api.fetchInfoFromCodeCommune(codeInsee);
                return records;
              });

              let data = records.length > 0 ? records[0].fields : null;
              return {
                selector: siret,
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
              return { selector: siret, anomalies: [e] };
            }
          },
          { parallel: 5 }
        ),
        transformData((data) => ({ ...data, source: name })),
        { promisify: false }
      );

      stream.on("finish", () => cache.flush());

      return stream;
    },
  };
};
