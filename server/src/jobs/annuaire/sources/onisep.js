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
        siret: data["n° SIRET"],
        uai: data["code UAI"],
        nom: data["nom"],
      };
    }),
    { promisify: false }
  );
};
