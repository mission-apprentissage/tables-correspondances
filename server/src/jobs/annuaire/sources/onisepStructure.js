const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const ovhStorage = require("../../../common/ovhStorage");

module.exports = async (stream) => {
  let source =
    stream || (await ovhStorage.getFileAsStream("/mna-tables-correspondances/annuaire/ONISEP-Structures.csv"));

  return oleoduc(
    source,
    csv({
      delimiter: ";",
      bom: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data["STRUCT SIRET"],
        uai: data["STRUCT UAI"],
        nom: data["STRUCT Libellé Amétys"],
      };
    }),
    { promisify: false }
  );
};
