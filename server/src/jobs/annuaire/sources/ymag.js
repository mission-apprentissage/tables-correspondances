const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let input =
    custom.input || (await getOvhFileAsStream("cfas-clients-erps/referentielCfas_ymag.csv", { storage: "mna-flux" }));

  return {
    stream() {
      return oleoduc(
        input,
        csv({
          delimiter: ";",
          trim: true,
          columns: true,
        }),
        transformData((data) => {
          return {
            selector: data["siret"].replace(/ /g, ""),
            uais: [data["uai"]],
          };
        }),
        { promisify: false }
      );
    },
  };
};
