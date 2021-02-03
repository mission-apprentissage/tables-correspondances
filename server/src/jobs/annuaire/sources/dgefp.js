const { oleoduc, filterData, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = (stream) => {
  return oleoduc(
    stream,
    csv({
      separator: ";",
      columns: (header) => header.map((column) => column.replace(/ /g, "")),
    }),
    filterData((data) => data.cfa === "Oui"),
    transformData((data) => {
      return {
        siret: `${data.siren}${data.num_etablissement}`,
        uai: null,
      };
    }),
    { promisify: false }
  );
};
