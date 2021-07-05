const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "cci-france";
  let input = custom.input || (await getOvhFileAsStream("cfas-reseaux/cfas-cci-france.csv", { storage: "mna-flux" }));

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
            from: name,
            selector: data["uai"],
            reseaux: ["cci-france"],
          };
        }),
        { promisify: false }
      );
    },
  };
};
