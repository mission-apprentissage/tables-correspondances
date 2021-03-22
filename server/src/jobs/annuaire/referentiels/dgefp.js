const { oleoduc, filterData, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let input = custom.input || (await getOvhFileAsStream("annuaire/DGEFP-20210105_public_ofs.csv"));

  return {
    name: "dgefp",
    stream(options = {}) {
      let filter = options.filter || ((data) => data.cfa === "Oui");

      return oleoduc(
        input,
        csv({
          trim: true,
          delimiter: ";",
          columns: (header) => header.map((column) => column.replace(/ /g, "")),
        }),
        filterData(filter),
        transformData((data) => {
          return {
            siret: `${data.siren}${data.num_etablissement}`,
          };
        }),
        { promisify: false }
      );
    },
  };
};
