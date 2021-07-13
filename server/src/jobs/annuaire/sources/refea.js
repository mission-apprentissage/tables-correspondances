const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "refea";

  return {
    name,
    async stream() {
      let input = custom.input || (await getOvhFileAsStream("annuaire/REFEA-liste-uai-avec-coordonnees.csv"));

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
            selector: data["uai_code_siret"],
            uais: [data["uai_code_educnationale"]],
          };
        }),
        { promisify: false }
      );
    },
  };
};
