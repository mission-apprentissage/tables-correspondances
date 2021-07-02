const { oleoduc, transformData } = require("oleoduc");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");
const { parseCsv } = require("../utils/csvUtils");

module.exports = async (custom = {}) => {
  let name = "sifa";
  let input = custom.input || (await getOvhFileAsStream("annuaire/Liste_Etablissements_2021-06-04_SIFA_RAMSESE.csv"));

  return {
    name,
    stream() {
      return oleoduc(
        input,
        parseCsv(),
        transformData((data) => {
          return {
            source: name,
            selector: data.numero_siren_siret_uai,
            uais: [data.numero_uai],
            data: {
              conformite_reglementaire: {
                conventionne: true,
              },
            },
          };
        }),
        { promisify: false }
      );
    },
  };
};
