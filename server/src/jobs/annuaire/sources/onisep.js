const { oleoduc, mergeStreams, transformData } = require("oleoduc");
const csv = require("csv-parse");
const ovhStorage = require("../../../common/ovhStorage");

const parseCSV = (source) => {
  return oleoduc(
    source,
    csv({
      delimiter: ";",
      bom: true,
      columns: true,
    })
  );
};

const getDefaultSource = async () => {
  let secondaires = await ovhStorage.getFileAsStream(
    "/mna-tables-correspondances/annuaire/ONISEP-ideo-structures_denseignement_secondaire.csv"
  );
  let superieurs = await ovhStorage.getFileAsStream(
    "/mna-tables-correspondances/annuaire/ONISEP-ideo-structures_denseignement_superieur.csv"
  );

  return mergeStreams(parseCSV(secondaires), parseCSV(superieurs));
};

module.exports = async (stream) => {
  let source = stream ? parseCSV(stream) : await getDefaultSource();

  return oleoduc(
    source,
    transformData((data) => {
      return {
        siret: data["n° SIRET"],
        uai: data["code UAI"],
        nom: data["nom"],
      };
    }),
    { promisify: false }
  );
};
