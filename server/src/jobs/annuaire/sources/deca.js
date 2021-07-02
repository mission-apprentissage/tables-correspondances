const { oleoduc, transformData } = require("oleoduc");
const { parseCsv } = require("../utils/csvUtils");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "deca";
  let input = custom.input || (await getOvhFileAsStream("annuaire/liste_etab_SIA_Dares.csv"));

  return {
    name,
    stream() {
      return oleoduc(
        input,
        parseCsv(),
        transformData((data) => {
          return {
            source: name,
            selector: data.FORM_ETABSIRET,
            uais: [data.FORM_ETABUAI_R],
          };
        }),
        { promisify: false }
      );
    },
  };
};
