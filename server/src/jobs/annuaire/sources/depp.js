const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "depp";

  return {
    name,
    async stream() {
      let input = custom.input || (await getOvhFileAsStream("annuaire/DEPP-CFASousConvRegionale_17122020_1.csv"));

      return oleoduc(
        input,
        csv({
          delimiter: ";",
          trim: true,
          bom: true,
          columns: true,
        }),
        transformData((data) => {
          return {
            from: name,
            selector: data["numero_siren_siret_uai"],
            uais: [data["numero_uai"]],
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
