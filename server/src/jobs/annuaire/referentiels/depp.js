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
        uai: data.numero_uai,
        siret: data.numero_siren_siret_uai,
        raisonSociale: data.patronyme_uai,
      };
    }),
    { promisify: false }
  );
};
