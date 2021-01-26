const { oleoduc, transformData } = require("oleoduc");
const { Etablissement } = require("../../../common/model");

module.exports = () => {
  return oleoduc(
    Etablissement.find().cursor(),
    transformData((etablissement) => {
      return {
        siret: etablissement.siret,
        uai: etablissement.uai,
        nom: etablissement.entreprise_raison_sociale,
      };
    }),
    { promisify: false }
  );
};
