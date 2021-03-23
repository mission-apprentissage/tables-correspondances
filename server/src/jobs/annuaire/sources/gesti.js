const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { decodeStream } = require("iconv-lite");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "gesti";
  let input =
    custom.input || (await getOvhFileAsStream("cfas-clients-erps/referentielCfas_gesti.csv", { storage: "mna-flux" }));

  return {
    name,
    stream() {
      return oleoduc(
        input,
        decodeStream("iso-8859-1"),
        csv({
          delimiter: ";",
          trim: true,
          columns: true,
        }),
        transformData((data) => {
          return {
            source: name,
            selector: data["siret"],
            uais: [data["uai_code_educnationale"]],
          };
        }),
        { promisify: false }
      );
    },
  };
};
