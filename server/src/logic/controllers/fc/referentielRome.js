const csvToJson = require("convert-csv-to-json-latin");

module.exports = () => {
  let referentielRome = [];

  return {
    load: (referentielRomeFile) => {
      referentielRome = csvToJson.getJsonFromCsv(referentielRomeFile);

      return {
        errors: 0,
        total: referentielRome.length,
      };
    },
    findRomes: (codeRNCP) => {
      let found = referentielRome.filter((x) => x.codeRNCP === codeRNCP);
      return found.length > 0 ? found : [];
    },
  };
};
