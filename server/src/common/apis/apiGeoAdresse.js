const axios = require("axios");
const queryString = require("query-string");
const logger = require("../logger");
const ApiError = require("./ApiError");

// Cf Documentation : https://geo.api.gouv.fr/adresse
const client = axios.create({
  baseURL: "https://api-adresse.data.gouv.fr",
  timeout: 10000,
});

class ApiGeoAdresse {
  constructor() {}

  async search(q, options = {}) {
    try {
      let params = queryString.stringify({ q, ...options });
      logger.debug(`[Adresse API] Searching adresse with parameters ${params}...`);
      const response = await client.get(`search/?${params}`);
      return response.data;
    } catch (e) {
      throw new ApiError("apiGeoAdresse", e.message, e.code || e.response.status);
    }
  }

  async reverse(lon, lat, options = {}) {
    try {
      let params = queryString.stringify({ lon, lat, ...options });
      logger.debug(`[Adresse API] Reverse geocode with parameters ${params}...`);
      const response = await client.get(`reverse/?${params}`);
      return response.data;
    } catch (e) {
      throw new ApiError("apiGeoAdresse", e.message, e.code || e.response.status);
    }
  }

  async searchPostcodeOnly(q, options = {}) {
    try {
      let params = queryString.stringify({ q, ...options });
      const response = await client.get(`search/?${params}`);
      logger.debug(`[Adresse API] Searching Postcode with parameters ${params}...`);
      return response.data;
    } catch (e) {
      throw new ApiError("apiGeoAdresse", e.message, e.code || e.response.status);
    }
  }

  async searchMunicipalityByCode(code, options = {}) {
    try {
      let params = `${options.isCityCode ? "citycode=" : ""}${code}&type=municipality`;
      logger.debug(`[Adresse API] Searching municipality with parameters ${params}...`);
      const response = await client.get(`search/?limit=1&q=${params}`);
      return response.data;
    } catch (e) {
      throw new ApiError("apiGeoAdresse", e.message, e.code || e.response.status);
    }
  }
}

const apiGeoAdresse = new ApiGeoAdresse();
module.exports = apiGeoAdresse;
