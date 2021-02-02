const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");

module.exports = (apiEntreprise) => {
  return oleoduc(
    Annuaire.find().cursor(), // Use annuaire as if it were the source
    transformData(async (doc) => {
      try {
        let info = await apiEntreprise.getEtablissement(doc.siret);
        return {
          siret: doc.siret,
          siegeSocial: info.siege_social,
          dateCreation: new Date(info.date_creation_etablissement * 1000),
          statut: info.etat_administratif.value === "A" ? "actif" : "fermé",
          region: info.region_implantation.code,
        };
      } catch (e) {
        return { error: e };
      }
    }),
    { promisify: false }
  );
};
