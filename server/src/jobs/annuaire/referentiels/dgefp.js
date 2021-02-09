const { oleoduc, filterData, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = (stream) => {
  return oleoduc(
    stream,
    csv({
      trim: true,
      delimiter: ";",
      columns: (header) => header.map((column) => column.replace(/ /g, "")),
    }),
    filterData((data) => data.cfa === "Oui"),
    transformData((data) => {
      return {
        siret: `${data.siren}${data.num_etablissement}`,
        raisonSociale: `${data.raison_sociale}`,
      };
    }),
    { promisify: false }
  );
};
