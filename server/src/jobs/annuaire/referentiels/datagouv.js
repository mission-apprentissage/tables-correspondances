const { oleoduc, filterData, transformData } = require("oleoduc");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");
const { parseCsv } = require("../utils/csvUtils");

module.exports = async (custom = {}) => {
  let input = custom.input || (await getOvhFileAsStream("annuaire/DGEFP-20210505_public_ofs.csv"));

  return {
    name: "datagouv",
    stream() {
      return oleoduc(
        input,
        parseCsv({
          columns: (header) => header.map((column) => column.replace(/ /g, "")),
        }),
        filterData((data) => data.cfa === "Oui"),
        transformData((data) => `${data.siren}${data.num_etablissement}`),
        { promisify: false }
      );
    },
  };
};
