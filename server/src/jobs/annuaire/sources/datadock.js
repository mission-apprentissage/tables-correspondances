const { oleoduc, transformData, filterData } = require("oleoduc");
const csv = require("csv-parse");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "datadock";
  let input = custom.input || (await getOvhFileAsStream("annuaire/BaseDataDock-latest.csv"));

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
        filterData((data) => data["REFERENCABLE"] === "OUI"),
        transformData((data) => {
          return {
            source: name,
            selector: data["siret"],
            data: {
              conformite_reglementaire: {
                certificateur: "datadock",
              },
            },
          };
        }),
        { promisify: false }
      );
    },
  };
};
