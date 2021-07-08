const { oleoduc, transformData } = require("oleoduc");
const { Etablissement } = require("../../../common/model");

module.exports = () => {
  let name = "etablissements";

  return {
    name,
    stream(options = {}) {
      let filters = options.filters || {};

      return oleoduc(
        Etablissement.find(filters, { siret: 1, uai: 1 }).lean().cursor(),
        transformData((etablissement) => {
          return {
            from: name,
            selector: etablissement.siret.trim(),
            uais: [etablissement.uai || undefined],
          };
        }),
        { promisify: false }
      );
    },
  };
};
