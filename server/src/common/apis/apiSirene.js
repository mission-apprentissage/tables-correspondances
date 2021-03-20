const axios = require("axios");
const logger = require("../logger");
const ApiError = require("./ApiError");
const apiRateLimiter = require("./apiRateLimiter");

//Documentation : https://entreprise.data.gouv.fr/api_doc/sirene
let executeWithRateLimiting = apiRateLimiter("apiSirene", {
  nbRequests: 5,
  durationInSeconds: 1,
  client: axios.create({
    baseURL: "https://entreprise.data.gouv.fr/api/sirene/v3",
    timeout: 10000,
  }),
});

class ApiSirene {
  getUniteLegale(siren) {
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Sirene API] Fetching unites_legales for siren ${siren}...`);
        let response = await client.get(`unites_legales/${siren}`);
        return response.data.unite_legale;
      } catch (e) {
        throw new ApiError("Api Sirene", e.message, e.code || e.response.status);
      }
    });
  }

  getEtablissement(siret) {
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Sirene API] Fetching etablissement ${siret}...`);
        let response = await client.get(`etablissements/${siret}`);

        return response.data.etablissement;
      } catch (e) {
        throw new ApiError("Api Sirene", e.message, e.code || e.response.status);
      }
    });
  }
}

module.exports = new ApiSirene();
