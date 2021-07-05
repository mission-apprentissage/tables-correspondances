const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "onisep-structure";
  let input = custom.input || (await getOvhFileAsStream("annuaire/ONISEP-Structures-20012021PL.csv"));

  return {
    name,
    stream() {
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
            selector: data["STRUCT SIRET"],
            uais: [data["STRUCT UAI"]],
          };
        }),
        { promisify: false }
      );
    },
  };
};
