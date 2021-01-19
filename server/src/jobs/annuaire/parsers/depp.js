const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = () => {
  return oleoduc(
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
    })
  );
};