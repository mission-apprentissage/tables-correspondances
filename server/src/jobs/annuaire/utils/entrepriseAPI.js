const axios = require("axios");
const logger = require("../../../common/logger");

module.exports = (apiEntrepriseKey) => {
  let getEtablissement = async (siret) => {
    logger.debug(`[Entreprise API] Fetching etablissement ${siret}...`);
    let response = await axios.get(`https://entreprise.api.gouv.fr/v2/etablissements/${siret}`, {
      params: {
        token: apiEntrepriseKey,
        context: "Catalogue MNA",
        recipient: "12000101100010", // Siret Dinum
        object: "Consolidation des données du Catalogue MNA",
      },
    });
    return response.data.etablissement;
  };

  return {
    getEtablissementStatus: async (siret) => {
      if (!siret) {
        return "invalide";
      }

      try {
        const etablissement = await getEtablissement(siret);
        return etablissement.etat_administratif.value === "A" ? "actif" : "fermé";
      } catch (e) {
        logger.error(e);
        let errors = {
          451: "indisponible",
          404: "inconnu",
          422: "invalide",
        };
        return errors[e.response.status] || "erreur";
      }
    },
  };
};
