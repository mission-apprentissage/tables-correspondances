const axios = require("axios");
const logger = require("../../common/logger");

module.exports = (apiEntrepriseKey) => {
  return {
    getEtablissement: async (siret) => {
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
    },
  };
};
