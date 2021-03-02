const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = (stream) => {
  return oleoduc(
    stream,
    csv({
      trim: true,
      delimiter: ";",
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data.numero_siren_siret_uai,
        raison_sociale: data.patronyme_uai,
        uai: data.numero_uai,
      };
    }),
    { promisify: false }
  );
};
