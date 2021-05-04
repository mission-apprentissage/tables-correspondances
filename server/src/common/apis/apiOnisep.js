const axios = require("axios");
const logger = require("../logger");
const config = require("config");
// const ApiError = require("./ApiError");
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
        // throw new ApiError("Api Onisep", e.message, e.code || e.response.status);
        return "";
      }
    });
  }

  async getAllEtablissements(size = 1000, allEtablissements = []) {
    try {
      const { results, total, from, size: retSize } = await this.getEtablissements({
        size: `${size}`,
        from: allEtablissements.length === 0 ? "0" : `${size}`,
      });

      allEtablissements = allEtablissements.concat(results);

      if (from + retSize < total) {
        return this.getAllEtablissements(from + size, allEtablissements);
      } else {
        return allEtablissements;
      }
    } catch (error) {
      if (error.response.status === 504) {
        console.log("timeout");
      } else {
        console.log(error);
      }
      return [];
    }
  }

  async getEtablissements({ q = undefined, academie = undefined, size = "10", from = "0" } = {}) {
    await this.login();
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Onisep API] Fetching etablissement ${{ q, academie }}...`);
        let response = await client.get(`dataset/5dcbcb79db355/search`, {
          headers: this.headers,
          params: {
            q,
            "facet.academie": academie,
            size,
            from,
          },
        });

        return response.data;
      } catch (e) {
        console.log(e);
        // throw new ApiError("Api Onisep", e.message, e.code || e.response.status);
        return { results: [] };
      }
    });
  }

  async getAllFormations(size = 1000, allFormations = []) {
    try {
      const { results, total, from, size: retSize } = await this.getFormations({
        size: `${size}`,
        from: allFormations.length === 0 ? "0" : `${size}`,
      });

      allFormations = allFormations.concat(results);

      if (from + retSize < total) {
        return this.getAllFormations(from + size, allFormations);
      } else {
        return allFormations;
      }
    } catch (error) {
      if (error.response.status === 504) {
        console.log("timeout");
      } else {
        console.log(error);
      }
      return [];
    }
  }

  async getFormations({ q = undefined, size = "10", from = "0" } = {}) {
    await this.login();
    return executeWithRateLimiting(async (client) => {
      try {
        logger.debug(`[Onisep API] Fetching Formations ${{ q }}...`);
        let response = await client.get(`dataset/5d317f6081105/search`, {
          headers: this.headers,
          params: {
            q,
            size,
            from,
          },
        });

        return response.data;
      } catch (e) {
        console.log(e);
        //throw new ApiError("Api Onisep", e.message, e.code || e.response.status);
        return { results: [] };
      }
    });
  }
}

module.exports = new ApiOnisep();
