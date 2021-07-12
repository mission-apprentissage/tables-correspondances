const { oleoduc, transformData, filterData } = require("oleoduc");
const { parseCsv } = require("../utils/csvUtils");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "deca";

  return {
    name,
    async stream() {
      let input = custom.input || (await getOvhFileAsStream("annuaire/liste_etab_SIA_Dares.csv"));

      return oleoduc(
        input,
        parseCsv(),
        filterData((data) => data["NB_CONTRATS_20201231"] !== "0"),
        transformData((data) => {
          return {
            from: name,
            selector: data.FORM_ETABSIRET,
            uais: [data.FORM_ETABUAI_R],
          };
        }),
        { promisify: false }
      );
    },
  };
};
