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
        siret: data["n° SIRET"],
        data: {
          uai: data["code UAI"],
        },
      };
    }),
    { promisify: false }
  );
};
