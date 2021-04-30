const { oleoduc, transformData } = require("oleoduc");
const { Etablissement } = require("../../../common/model");

module.exports = () => {
  let name = "tables-correspondances";

  return {
    name,
    stream(options = {}) {
      let filters = options.filters || {};

      return oleoduc(
        Etablissement.find(filters, { siret: 1, uai: 1 }).lean().cursor(),
        transformData((etablissement) => {
          return {
            source: name,
            selector: etablissement.siret,
            uais: [etablissement.uai],
          };
        }),
        { promisify: false }
      );
    },
  };
};
