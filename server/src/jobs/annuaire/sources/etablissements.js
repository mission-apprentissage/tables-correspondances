const { oleoduc, transformData } = require("oleoduc");
const { Etablissement } = require("../../../common/model");

module.exports = () => {
  return {
    stream(options = {}) {
      let filters = options.filters || {};

      return oleoduc(
        Etablissement.find(filters, { siret: 1, uai: 1 }).lean().cursor(),
        transformData((etablissement) => {
          return {
            selector: etablissement.siret,
            uais: [etablissement.uai],
          };
        }),
        { promisify: false }
      );
    },
  };
};
