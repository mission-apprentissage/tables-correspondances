const { oleoduc, transformData, filterData } = require("oleoduc");
const csv = require("csv-parse");
const { decodeStream } = require("iconv-lite");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (options = {}) => {
  let filters = options.filters || {};
  let stream =
    options.input || (await getOvhFileAsStream("cfas-clients-erps/referentielCfas_gesti.csv", { storage: "mna-flux" }));

  return oleoduc(
    stream,
    decodeStream("iso-8859-1"),
    csv({
      delimiter: ";",
      trim: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data["siret"],
        uais: [data["uai_code_educnationale"]],
      };
    }),
    filterData((data) => {
      return filters.siret ? filters.siret === data.siret : !!data;
    }),
    { promisify: false }
  );
};
