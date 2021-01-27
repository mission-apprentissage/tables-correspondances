const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const ovhStorage = require("../../../common/ovhStorage");

module.exports = async (stream) => {
  let source =
    stream ||
    (await ovhStorage.getFileAsStream("/mna-tables-correspondances/annuaire/DEPP-CFASousConvRegionale_17122020_1.csv"));

  return oleoduc(
    source,
    csv({
      delimiter: ";",
      columns: true,
    }),
    transformData((data) => {
      return {
        uai: data.numero_uai,
        siret: data.numero_siren_siret_uai,
        nom: data.patronyme_uai,
      };
    }),
    { promisify: false }
  );
};
