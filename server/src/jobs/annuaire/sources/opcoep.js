const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const ovhStorage = require("../../../common/ovhStorage");

module.exports = async (stream) => {
  let source =
    stream ||
    (await ovhStorage.getFileAsStream(
      "/mna-tables-correspondances/annuaire/OPCO EP-20201202 OPCO EP - Jeunes sans contrat par CFA, région et formation au 26 nov.csv"
    ));

  return oleoduc(
    source,
    csv({
      delimiter: ";",
      bom: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data["SIRET CFA"],
        uai: data["N UAI CFA"],
        nom: data["Nom CFA"],
      };
    }),
    { promisify: false }
  );
};
