const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parser");

module.exports = () => {
  return oleoduc(
    csv({
      separator: "|",
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
