const { oleoduc, transformData } = require("oleoduc");
const { Etablissement } = require("../../../common/model");

module.exports = () => {
  let name = "catalogue";

  return {
    name,
    stream() {
      return oleoduc(
        Etablissement.find({}, { siret: 1, uai: 1 }).batchSize(5).lean().cursor(),
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
