const { oleoduc, transformData, filterData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = (stream, options = {}) => {
  let filters = options.filters || {};

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
        uais: [data["STRUCT UAI"]],
      };
    }),
    filterData((data) => {
      return filters.siret ? filters.siret === data.siret : !!data;
    }),
    { promisify: false }
  );
};
