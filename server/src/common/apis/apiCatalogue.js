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
  getFormations(query, options) {
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

        logger.debug(`[Catalogue API] Fetching formations with params ${params}...`);
        let response = await axios.get(`${apiEndpoint}/api/entity/formations2021?${params}`);
        return response.data;
      } catch (e) {
        throw new ApiError("Api Catalogue", e.message, e.code || e.response.status);
      }
    });
  }
}

module.exports = new ApiCatalogue();
