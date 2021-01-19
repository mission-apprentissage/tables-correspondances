const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = () => {
  return oleoduc(
    csv({
      delimiter: ";",
      bom: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data["uai_code_siret"],
        uai: data["uai_code_educnationale"],
        nom: data["uai_libelle_educnationale"],
      };
    })
  );
};
