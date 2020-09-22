const csvToJson = require("convert-csv-to-json-latin");

module.exports = () => {
  let referentielNsf = [];

  return {
    load: (referentielNsfFile) => {
      referentielNsf = csvToJson.getJsonFromCsv(referentielNsfFile);

      return {
        errors: 0,
        total: referentielNsf.length,
      };
    },
    findNsf: (codeRNCP) => {
      let found = referentielNsf.filter((x) => x.codeRNCP === codeRNCP);
      return found.length > 0 ? found : [];
    },
  };
};
