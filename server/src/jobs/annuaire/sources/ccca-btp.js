const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "ccca-btp";
  let input = custom.input || (await getOvhFileAsStream("cfas-reseaux/cfas-ccca-btp.csv", { storage: "mna-flux" }));

  return {
    name,
    stream() {
      return oleoduc(
        input,
        csv({
          delimiter: ";",
          trim: true,
          bom: true,
          columns: true,
        }),
        transformData((data) => {
          return {
            source: name,
            selector: data["uai"],
            reseaux: ["ccca-btp"],
          };
        }),
        { promisify: false }
      );
    },
  };
};
