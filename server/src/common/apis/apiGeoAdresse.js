const axios = require("axios");
const queryString = require("query-string");
const logger = require("../logger");

// Cf Documentation : https://geo.api.gouv.fr/adresse
const apiEndpoint = "https://api-adresse.data.gouv.fr";

class ApiGeoAdresse {
  constructor() {}

  async search(q, options = {}) {
    let params = queryString.stringify({ q, ...options });
    logger.debug(`[Adresse API] Searching adresse with parameters ${params}...`);
    const response = await axios.get(`${apiEndpoint}/search/?${params}`);
    return response.data;
  }

  async searchPostcodeOnly(q, options = {}) {
    let params = queryString.stringify({ q, ...options });
    const response = await axios.get(`${apiEndpoint}/search/?${params}`);
    logger.debug(`[Adresse API] Searching Postcode with parameters ${params}...`);
    return response.data;
  }

  async searchMunicipalityByCode(code, options = {}) {
    let params = `${options.isCityCode ? "citycode=" : ""}${code}&type=municipality`;
    logger.debug(`[Adresse API] Searching municipality with parameters ${params}...`);
    const response = await axios.get(`${apiEndpoint}/search/?limit=1&q=${params}`);
    return response.data;
  }
}

const apiGeoAdresse = new ApiGeoAdresse();
module.exports = apiGeoAdresse;
