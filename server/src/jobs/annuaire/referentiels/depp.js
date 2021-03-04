const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (options = {}) => {
  let stream = options.input || (await getOvhFileAsStream("annuaire/DEPP-CFASousConvRegionale_17122020_1.csv"));

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
