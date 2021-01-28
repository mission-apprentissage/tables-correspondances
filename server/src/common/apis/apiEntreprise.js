const axios = require("axios");
const config = require("config");
const logger = require("../logger");

// Cf Documentation : https://doc.entreprise.api.gouv.fr/#param-tres-obligatoires
const apiEndpoint = "https://entreprise.api.gouv.fr/v2";
const apiParams = {
  token: config.apiEntreprise,
  context: "Catalogue MNA",
  recipient: "12000101100010", // Siret Dinum
  object: "Consolidation des données du Catalogue MNA",
};

class ApiEntreprise {
  constructor() {}

  async getEntreprise(siren) {
    logger.debug(`[Entreprise API] Fetching entreprise ${siren}...`);
    let response = await axios.get(`${apiEndpoint}/entreprises/${siren}`, {
      params: apiParams,
    });
    return response.data.entreprise;
  }

  async getEtablissement(siret) {
    logger.debug(`[Entreprise API] Fetching etablissement ${siret}...`);
    let response = await axios.get(`${apiEndpoint}/etablissements/${siret}`, {
      params: apiParams,
    });

    return response.data.etablissement;
  }
}

const apiEntreprise = new ApiEntreprise();
module.exports = apiEntreprise;
