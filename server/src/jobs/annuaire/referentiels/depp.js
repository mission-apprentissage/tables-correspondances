const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let input = custom.input || (await getOvhFileAsStream("annuaire/DEPP-CFASousConvRegionale_17122020_1.csv"));

  return {
    stream() {
      return oleoduc(
        input,
        csv({
          trim: true,
          delimiter: ";",
          columns: true,
        }),
        transformData((data) => {
          return {
            siret: data.numero_siren_siret_uai,
            uai: data.numero_uai,
            conformite_reglementaire: {
              conventionne: true,
            },
          };
        }),
        { promisify: false }
      );
    },
  };
};
