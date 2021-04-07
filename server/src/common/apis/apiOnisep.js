const axios = require("axios");
const logger = require("../logger");
const config = require("config");
const ApiError = require("./ApiError");
const apiRateLimiter = require("./apiRateLimiter");
const FormData = require("form-data");

//Documentation : http://opendata.onisep.fr/3-api.htm
let executeWithRateLimiting = apiRateLimiter("apiOnisep", {
  nbRequests: 1,
  durationInSeconds: 1,
  client: axios.create({
    baseURL: "https://api.projets.opendata.onisep.fr/api/1.0",
    timeout: 5000,
  }),
});

class ApiOnisep {
  constructor() {
    this.token = null;
    this.headers = null;
  }

  async login() {
    if (this.token) {
      return;
    }
    this.token = await this.getToken();
    this.headers = {
      "Application-ID": "6053143b3574664c418b4580",
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
    };
  }

  getToken() {
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Onisep API] Login...`);

        const form = new FormData();
        form.append("email", config.onisepCredential.email);
        form.append("password", config.onisepCredential.password);

        let response = await client.post(`/login`, form, { headers: form.getHeaders() });
        return response.data.token;
      } catch (e) {
        console.log(e);
        throw new ApiError("Api Onisep", e.message, e.code || e.response.status);
      }
    });
  }

  async getEtablissement({ q = undefined, academie = undefined } = {}) {
    await this.login();
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Onisep API] Fetching etablissement ${{ q, academie }}...`);
        let response = await client.get(`dataset/5dcbcb79db355/search`, {
          headers: this.headers,
          params: {
            q,
            "facet.academie": academie,
          },
        });

        return response.data;
      } catch (e) {
        console.log(e);
        throw new ApiError("Api Onisep", e.message, e.code || e.response.status);
      }
    });
  }

  async getFormations({ q = undefined } = {}) {
    await this.login();
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Onisep API] Fetching Formations ${{ q }}...`);
        let response = await client.get(`dataset/5d317f6081105/search`, {
          headers: this.headers,
          params: {
            q,
          },
        });

        return response.data;
      } catch (e) {
        throw new ApiError("Api Onisep", e.message, e.code || e.response.status);
      }
    });
  }
}

module.exports = new ApiOnisep();
