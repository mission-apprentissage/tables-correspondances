const { oleoduc, transformData } = require("oleoduc");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");
const { parseCsv } = require("../utils/csvUtils");

module.exports = (custom = {}) => {
  let name = "voeux-affelnet";

  return {
    name,
    async stream() {
      let input =
        custom.input ||
        (await getOvhFileAsStream("annuaire/voeux-affelnet-export-cfas-confirmes-actives-2021-09-03.csv"));

      return oleoduc(
        input,
        parseCsv(),
        transformData(({ uai, email }) => {
          return {
            from: name,
            selector: uai,
            contacts: [{ email, confirmé: true }],
          };
        }),
        { promisify: false }
      );
    },
  };
};
