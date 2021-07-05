const { oleoduc, transformData } = require("oleoduc");
const mergeStream = require("merge-stream");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");
const { parseCsv } = require("../utils/csvUtils");

function readCsv(stream) {
  return oleoduc(stream, parseCsv(), { promisify: false });
}

async function defaultStream() {
  return mergeStream(
    readCsv(await getOvhFileAsStream("annuaire/Liste_Etablissements_2021-06-17_RAMSESE_AOuvrir.csv")),
    readCsv(await getOvhFileAsStream("annuaire/Liste_Etablissements_2021-06-18_RAMSESE_Complement.csv"))
  );
}

module.exports = async (custom = {}) => {
  let name = "ramsese";
  let stream = custom.input ? readCsv(custom.input) : await defaultStream();

  return {
    name,
    stream() {
      return oleoduc(
        stream,
        transformData((data) => {
          return {
            from: name,
            selector: data.numero_siren_siret_uai,
            uais: [data.numero_uai],
          };
        }),
        { promisify: false }
      );
    },
  };
};
