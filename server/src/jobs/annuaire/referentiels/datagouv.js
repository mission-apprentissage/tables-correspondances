const { oleoduc, filterData, transformData } = require("oleoduc");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");
const { parseCsv } = require("../utils/csvUtils");

module.exports = async (custom = {}) => {
  let name = "datagouv";

  return {
    name,
    async stream() {
      let input = custom.input || (await getOvhFileAsStream("annuaire/DGEFP-20210505_public_ofs.csv"));

      return oleoduc(
        input,
        parseCsv({
          columns: (header) => header.map((column) => column.replace(/ /g, "")),
        }),
        filterData((data) => data.cfa === "Oui"),
        transformData((data) => {
          return {
            from: name,
            siret: `${data.siren}${data.num_etablissement}`,
          };
        }),
        { promisify: false }
      );
    },
    asSource() {
      return {
        name,
        stream: async () => {
          let input = await this.stream();

          return oleoduc(
            input,
            transformData((data) => {
              return {
                from: name,
                selector: data.siret,
              };
            }),
            { promisify: false }
          );
        },
      };
    },
  };
};
