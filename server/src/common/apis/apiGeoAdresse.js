const axios = require("axios");
const queryString = require("query-string");
const logger = require("../logger");
const ApiError = require("./ApiError");

// Cf Documentation : https://geo.api.gouv.fr/adresse
const apiEndpoint = "https://api-adresse.data.gouv.fr";

class ApiGeoAdresse {
  constructor() {}

  async search(q, options = {}) {
    try {
      let params = queryString.stringify({ q, ...options });
      logger.debug(`[Adresse API] Searching adresse with parameters ${params}...`);
      const response = await axios.get(`${apiEndpoint}/search/?${params}`);
      return response.data;
    } catch (e) {
      throw new ApiError("Api Entreprise", e.message, e.response.status);
    }
  }

  async searchPostcodeOnly(q, options = {}) {
    try {
      let params = queryString.stringify({ q, ...options });
      const response = await axios.get(`${apiEndpoint}/search/?${params}`);
      logger.debug(`[Adresse API] Searching Postcode with parameters ${params}...`);
      return response.data;
    } catch (e) {
      throw new ApiError("Api Entreprise", e.message, e.response.status);
    }
  }

  async searchMunicipalityByCode(code, options = {}) {
    try {
      let params = `${options.isCityCode ? "citycode=" : ""}${code}&type=municipality`;
      logger.debug(`[Adresse API] Searching municipality with parameters ${params}...`);
      const response = await axios.get(`${apiEndpoint}/search/?limit=1&q=${params}`);
      return response.data;
    } catch (e) {
      throw new ApiError("Api Entreprise", e.message, e.response.status);
    }
  }
}

const apiGeoAdresse = new ApiGeoAdresse();
module.exports = apiGeoAdresse;
