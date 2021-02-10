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
        data: {
          uai: data["STRUCT UAI"],
        },
      };
    }),
    { promisify: false }
  );
};
