const { oleoduc, transformData } = require("oleoduc");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");
const { parseCsv } = require("../utils/csvUtils");

module.exports = async (custom = {}) => {
  let name = "tableau-de-bord";
  let input =
    custom.input ||
    (await getOvhFileAsStream("support/tdb_uaisSiretsCouples_1630597270816.csv", { storage: "mna-tableau-de-bord" }));

  return {
    name,
    stream() {
      return oleoduc(
        input,
        parseCsv(),
        transformData(({ siret, uai }) => {
          return {
            from: name,
            selector: siret,
            uais: [uai],
          };
        }),
        { promisify: false }
      );
    },
  };
};
