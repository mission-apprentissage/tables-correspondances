const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "mfr";
  let input = custom.input || (await getOvhFileAsStream("cfas-reseaux/cfas-mfr.csv", { storage: "mna-flux" }));

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
          let uais = [...new Set([data["uai"], data["uai_code_educnationale"]])];
          return {
            source: name,
            selector: {
              $or: [{ siret: data["siret"] }, { "uais.uai": { $in: uais } }],
            },
            uais,
            reseaux: ["mfr"],
          };
        }),
        { promisify: false }
      );
    },
  };
};
