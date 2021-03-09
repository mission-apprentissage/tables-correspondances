const { oleoduc, transformData, filterData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (options = {}) => {
  let filters = options.filters || {};
  let stream =
    options.input ||
    (await getOvhFileAsStream(
      "annuaire/OPCO EP-20201202 OPCO EP - Jeunes sans contrat par CFA, région et formation au 26 nov.csv"
    ));

  return oleoduc(
    stream,
    csv({
      delimiter: ";",
      trim: true,
      bom: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data["SIRET CFA"],
        uais: [data["N UAI CFA"]],
      };
    }),
    filterData((data) => {
      return filters.siret ? filters.siret === data.siret : !!data;
    }),
    { promisify: false }
  );
};
