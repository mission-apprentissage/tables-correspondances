const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const mergeStream = require("merge-stream");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

function parseCSV(stream) {
  return oleoduc(
    stream,
    csv({
      delimiter: ";",
      trim: true,
      bom: true,
      skip_lines_with_error: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        from: "onisep",
        selector: data["n° SIRET"],
        uais: [data["code UAI"]],
      };
    }),
    { promisify: false }
  );
}

async function defaultStream() {
  return mergeStream(
    parseCSV(await getOvhFileAsStream("annuaire/ONISEP-ideo-structures_denseignement_secondaire.csv")),
    parseCSV(await getOvhFileAsStream("annuaire/ONISEP-ideo-structures_denseignement_superieur.csv"))
  );
}

module.exports = async (custom = {}) => {
  let name = "onisep";

  return {
    name,
    async stream() {
      return custom.input ? parseCSV(custom.input) : await defaultStream();
    },
  };
};
