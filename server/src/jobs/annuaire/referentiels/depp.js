const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let input = custom.input || (await getOvhFileAsStream("annuaire/DEPP-CFASousConvRegionale_17122020_1.csv"));

  return {
    name: "depp",
    stream() {
      return oleoduc(
        input,
        csv({
          trim: true,
          delimiter: ";",
          columns: true,
        }),
        transformData((data) => data.numero_siren_siret_uai),
        { promisify: false }
      );
    },
  };
};
