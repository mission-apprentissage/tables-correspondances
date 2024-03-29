const axios = require("axios");
const config = require("config");
const logger = require("../logger");
const ApiError = require("./ApiError");
const apiRateLimiter = require("./apiRateLimiter");

// Cf Documentation : https://doc.entreprise.api.gouv.fr/#param-tres-obligatoires
const executeWithRateLimiting = apiRateLimiter("apiEntreprise", {
  //250 requests per minute
  nbRequests: 250,
  durationInSeconds: 60,
  client: axios.create({
    baseURL: "https://entreprise.api.gouv.fr/v2",
    timeout: 5000,
  }),
});

const apiParams = {
  token: config.apiEntreprise,
  context: "Catalogue MNA",
  recipient: "12000101100010", // Siret Dinum
  object: "Consolidation des données du Catalogue MNA",
};

class ApiEntreprise {
  async getEntreprise(siren) {
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Entreprise API] Fetching entreprise ${siren}...`);
        let response = await client.get(`entreprises/${siren}`, {
          params: apiParams,
        });
        if (!response?.data?.entreprise) {
          throw new ApiError("Api Entreprise", "No entreprise data received");
        }
        return response.data;
      } catch (e) {
        console.error(e);
        throw new ApiError("Api Entreprise", e.message, e.code || e.response.status);
      }
    });
  }

  async getEtablissement(siret) {
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Entreprise API] Fetching etablissement ${siret}...`);
        let response = await client.get(`etablissements/${siret}`, {
          params: apiParams,
        });
        if (!response?.data?.etablissement) {
          throw new ApiError("Api Entreprise", "No etablissement data received");
        }
        return response.data.etablissement;
      } catch (e) {
        console.error(e);
        throw new ApiError("Api Entreprise", e.message, e.code || e.response.status);
      }
    });
  }
}

const apiEntreprise = new ApiEntreprise();
module.exports = apiEntreprise;
