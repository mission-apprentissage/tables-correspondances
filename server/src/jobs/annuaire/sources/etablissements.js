const { oleoduc, transformData } = require("oleoduc");
const { Etablissement } = require("../../../common/model");

module.exports = (options = {}) => {
  let filters = options.filters || {};

  return oleoduc(
    Etablissement.find(filters).lean().cursor(),
    transformData((etablissement) => {
      return {
        siret: etablissement.siret,
        uais: [etablissement.uai],
      };
    }),
    { promisify: false }
  );
};
