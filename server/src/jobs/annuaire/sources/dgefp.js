const { oleoduc, filterData, transformData } = require("oleoduc");
const csv = require("csv-parse");
const ovhStorage = require("../../../common/ovhStorage");

module.exports = async (stream) => {
  let source =
    stream || (await ovhStorage.getFileAsStream("/mna-tables-correspondances/annuaire/DGEFP-20210105_public_ofs.csv"));

  return oleoduc(
    source,
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
    }),
    { promisify: false }
  );
};
