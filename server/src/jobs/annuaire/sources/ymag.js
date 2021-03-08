const { oleoduc, transformData, filterData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (options = {}) => {
  let filters = options.filters || {};
  let stream =
    options.input || (await getOvhFileAsStream("cfas-clients-erps/referentielCfas_ymag.csv", { storage: "mna-flux" }));

  return oleoduc(
    stream,
    csv({
      delimiter: ";",
      trim: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data["siret"].replace(/ /g, ""),
        uais: [data["uai"]],
      };
    }),
    filterData((data) => {
      return filters.siret ? filters.siret === data.siret : !!data;
    }),
    { promisify: false }
  );
};
