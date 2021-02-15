const { oleoduc, transformData, filterData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const apiEsSup = require("../../../common/apis/apiEsSup");

module.exports = async (options = {}) => {
  let api = options.apiEsSup || apiEsSup;

  return oleoduc(
    Annuaire.find().cursor(),
    filterData((e) => !!e.adresse),
    transformData(async (etablissement) => {
      let siret = etablissement.siret;
      let codeInsee = etablissement.adresse.code_insee;

      try {
        let { records } = await api.fetchInfoFromCodeCommune(codeInsee);
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
};
