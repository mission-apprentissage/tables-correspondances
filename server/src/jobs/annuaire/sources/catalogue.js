const { oleoduc, transformData, filterData } = require("oleoduc");
const { Etablissement } = require("../../../common/model");

module.exports = (options = {}) => {
  let filters = options.filters || {};
  let stream = options.input || Etablissement.find().cursor();

  return oleoduc(
    stream,
    filterData((e) => (filters.siret ? filters.siret === e.siret : !!e)),
    transformData((etablissement) => {
      return {
        siret: etablissement.siret,
        uais: [etablissement.uai],
      };
    }),
    { promisify: false }
  );
};
