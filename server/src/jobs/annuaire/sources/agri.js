const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "agri";

  return {
    name,
    async stream() {
      let input = custom.input || (await getOvhFileAsStream("cfas-reseaux/cfas-agri.csv", { storage: "mna-flux" }));

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
            selector: data["siret"],
            uais: [data["uai"]],
            reseaux: ["agri"],
          };
        }),
        { promisify: false }
      );
    },
  };
};
