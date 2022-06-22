const axios = require("axios");
const logger = require("../logger");
const ApiError = require("./ApiError");
const apiRateLimiter = require("./apiRateLimiter");

// Cf Documentation : https://www.cfadock.fr/Home/ApiDescription

const executeWithRateLimiting = apiRateLimiter("apiCfaDock", {
  // 25 requests per minute (even if it is written 30/minutes in documentation, we get a lot of 429)
  nbRequests: 25,
  durationInSeconds: 60,
  client: axios.create({
    baseURL: "https://www.cfadock.fr/api",
    timeout: 5000,
  }),
});

class ApiCfaDock {
  getOpcoData(siren) {
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[CfaDock API] Search opco data ${siren}...`);
        let response = await client.get(`opcos/?siret=${siren}`);
        if (!response?.data?.searchStatus) {
          throw new ApiError("Api CFAdock", `No data found for siren=${siren}`);
        }
        return {
          idcc: response.data.idcc,
          opco_nom: response.data.opcoName,
          opco_siren: response.data.opcoSiren,
        };
      } catch (e) {
        throw new ApiError("Api CFAdock", `${e.message} for siren=${siren}`, e.code || e.response.status);
      }
    });
  }
}

const apiCfaDock = new ApiCfaDock();
module.exports = apiCfaDock;
