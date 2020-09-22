const csvToJson = require("convert-csv-to-json-latin");

module.exports = () => {
  let referentielRncp = [];

  return {
    load: (referentielRncpFile) => {
      referentielRncp = csvToJson.getJsonFromCsv(referentielRncpFile);

      return {
        errors: 0,
        total: referentielRncp.length,
      };
    },
    findInfo: (codeRNCP) => {
      let found = referentielRncp.filter((x) => x.codeRNCP === codeRNCP);
      return found.length > 0 ? found : [];
    },
  };
};
