const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const ovhStorage = require("../../../common/ovhStorage");

module.exports = async (stream) => {
  let source =
    stream ||
    (await ovhStorage.getFileAsStream("/mna-tables-correspondances/annuaire/REFEA-liste-uai-avec-coordonnees.csv"));

  return oleoduc(
    source,
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
    }),
    { promisify: false }
  );
};
