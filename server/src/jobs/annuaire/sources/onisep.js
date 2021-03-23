const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const mergeStream = require("merge-stream");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

function parse(stream) {
  return oleoduc(
    stream,
    csv({
      delimiter: ";",
      trim: true,
      bom: true,
      skip_lines_with_error: true,
      columns: true,
    })
  );
}

async function defaultStream() {
  return mergeStream(
    parse(await getOvhFileAsStream("annuaire/ONISEP-ideo-structures_denseignement_secondaire.csv")),
    parse(await getOvhFileAsStream("annuaire/ONISEP-ideo-structures_denseignement_superieur.csv"))
  );
}

module.exports = (custom = {}) => {
  let name = "onisep";

  return {
    name,
    async stream() {
      let input = custom.input ? parse(custom.input) : await defaultStream();

      return oleoduc(
        input,
        transformData((data) => {
          return {
            source: name,
            selector: data["n° SIRET"],
            uais: [data["code UAI"]],
          };
        }),
        { promisify: false }
      );
    },
  };
};
