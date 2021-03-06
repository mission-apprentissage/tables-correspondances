const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "opcoep";
  let input =
    custom.input ||
    (await getOvhFileAsStream(
      "annuaire/OPCO EP-20201202 OPCO EP - Jeunes sans contrat par CFA, région et formation au 26 nov.csv"
    ));

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
            selector: data["SIRET CFA"],
            uais: [data["N UAI CFA"]],
          };
        }),
        { promisify: false }
      );
    },
  };
};
