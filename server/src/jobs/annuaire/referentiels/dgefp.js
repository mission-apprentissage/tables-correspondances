const { oleoduc, filterData, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (options = {}) => {
  let stream = options.input || (await getOvhFileAsStream("annuaire/DGEFP-20210105_public_ofs.csv"));

  return oleoduc(
    stream,
    csv({
      trim: true,
      delimiter: ";",
      columns: (header) => header.map((column) => column.replace(/ /g, "")),
    }),
    filterData((data) => data.cfa === "Oui"),
    transformData((data) => {
      return {
        siret: `${data.siren}${data.num_etablissement}`,
      };
    }),
    { promisify: false }
  );
};
