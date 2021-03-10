const axios = require("axios");
const queryString = require("query-string");
const logger = require("../logger");
const ApiError = require("./ApiError");
const apiRateLimiter = require("./apiRateLimiter");

const apiEndpoint = "https://catalogue.apprentissage.beta.gouv.fr";

let executeWithRateLimiting = apiRateLimiter("apiCatalogue", {
  nbRequests: 5,
  durationInSeconds: 1,
});

class ApiCatalogue {
  getFormations(query, { annee, ...options }) {
    return executeWithRateLimiting(async () => {
      try {
        let params = queryString.stringify(
          {
            query: JSON.stringify(query),
            ...Object.keys(options).reduce((acc, key) => {
              return {
                ...acc,
                [key]: JSON.stringify(options[key]),
              };
            }, {}),
          },
          { encode: false }
        );

        let version = `${annee || ""}`;
        logger.debug(`[Catalogue API] Fetching formations ${version} with params ${params}...`);
        let response = await axios.get(`${apiEndpoint}/api/entity/formations${version}?${params}`);
        return response.data;
      } catch (e) {
        throw new ApiError("Api Catalogue", e.message, e.code || e.response.status);
      }
    });
  }
}

module.exports = new ApiCatalogue();
