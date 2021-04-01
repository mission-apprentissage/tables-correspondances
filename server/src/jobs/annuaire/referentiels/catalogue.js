const { oleoduc, transformData } = require("oleoduc");
const { Etablissement } = require("../../../common/model");

module.exports = async (custom = {}) => {
  return {
    name: "catalogue",
    stream() {
      let input = custom.input || Etablissement.find({}, { siret: 1 }).lean().cursor();

      return oleoduc(
        input,
        transformData((etablissement) => {
          return {
            siret: etablissement.siret,
            ...(etablissement.uai ? { uai: etablissement.uai } : {}),
          };
        }),
        { promisify: false }
      );
    },
  };
};
