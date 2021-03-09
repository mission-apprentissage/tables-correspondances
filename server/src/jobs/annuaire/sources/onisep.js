const { oleoduc, transformData, filterData } = require("oleoduc");
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

module.exports = async (options = {}) => {
  let filters = options.filters || {};
  let stream = options.input ? parse(options.input) : await defaultStream();

  return oleoduc(
    stream,
    transformData((data) => {
      return {
        siret: data["n° SIRET"],
        uais: [data["code UAI"]],
      };
    }),
    filterData((e) => (filters.siret ? filters.siret === e.siret : !!e)),
    { promisify: false }
  );
};
