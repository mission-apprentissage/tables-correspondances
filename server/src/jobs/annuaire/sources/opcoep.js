const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = async (stream) => {
  return oleoduc(
    stream,
    csv({
      delimiter: ";",
      bom: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data["SIRET CFA"],
        uai: data["N UAI CFA"],
        nom: data["Nom CFA"],
      };
    }),
    { promisify: false }
  );
};
