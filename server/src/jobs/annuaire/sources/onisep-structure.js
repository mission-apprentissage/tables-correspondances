const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = (stream) => {
  return oleoduc(
    stream,
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
    })
  );
};
