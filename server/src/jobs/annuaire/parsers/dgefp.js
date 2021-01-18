const { oleoduc, filterData, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = () => {
  return oleoduc(
    csv({
      separator: ";",
      columns: (header) => header.map((column) => column.replace(/ /g, "")),
    }),
    filterData((data) => data.cfa === "Oui"),
    transformData((data) => {
      return {
        siret: `${data.siren}${data.num_etablissement}`,
        uai: null,
        nom: data.raison_sociale,
      };
    })
  );
};
