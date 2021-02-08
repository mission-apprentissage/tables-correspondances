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
        siret: data["SIRET CFA"],
        data: {
          uai: data["N UAI CFA"],
        },
      };
    }),
    { promisify: false }
  );
};
