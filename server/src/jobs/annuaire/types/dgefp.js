const { oleoduc, filterData, transformData } = require("oleoduc");
const csv = require("csv-parser");

module.exports = {
  etablissementsStream: (source) => {
    return oleoduc(
      source,
      csv({
        separator: ";",
        mapHeaders: ({ header }) => header.replace(/ /g, ""),
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
  },
};
