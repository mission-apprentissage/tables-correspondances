const axios = require("axios");
const logger = require("../logger");
const ApiError = require("./ApiError");
const apiRateLimiter = require("./apiRateLimiter");

//Documentation : https://entreprise.data.gouv.fr/api_doc/sirene
const apiEndpoint = "https://entreprise.data.gouv.fr/api/sirene/v3";

let executeWithRateLimiting = apiRateLimiter("apiSirene", {
  nbRequests: 5,
  durationInSeconds: 1,
});

class ApiSirene {
  getUniteLegale(siren) {
    return executeWithRateLimiting(async () => {
      try {
        logger.debug(`[Sirene API] Fetching siren ${siren}...`);
        let response = await axios.get(`${apiEndpoint}/unites_legales/${siren}`);
        return response.data.unite_legale;
      } catch (e) {
        throw new ApiError("Api Sirene", e.message, e.code);
      }
    });
  }

  async getEtablissement(siret) {
    return executeWithRateLimiting(async () => {
      try {
        logger.debug(`[Sirene API] Fetching etablissement ${siret}...`);
        let response = await axios.get(`${apiEndpoint}/etablissements/${siret}`);

        return response.data.etablissement;
      } catch (e) {
        throw new ApiError("Api Sirene", e.message, e.code);
      }
    });
  }
}

const apiEntreprise = new ApiSirene();
module.exports = apiEntreprise;
