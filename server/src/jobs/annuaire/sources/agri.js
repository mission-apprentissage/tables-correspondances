const { oleoduc, transformData, filterData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (options = {}) => {
  let filters = options.filters || {};
  let stream = options.input || (await getOvhFileAsStream("cfas-reseaux/cfas-agri.csv", { storage: "mna-flux" }));

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
        siret: data["siret"],
        uais: [data["uai"]],
        reseaux: ["agri"],
        data: {},
      };
    }),
    filterData((data) => {
      return filters.siret ? filters.siret === data.siret : !!data;
    }),
    { promisify: false }
  );
};
