const axios = require("axios");

// Cf Documentation : https://geo.api.gouv.fr/adresse
const apiEndpoint = "https://api-adresse.data.gouv.fr";

class ApiGeoAdresse {
  constructor() {}

  async search(q, postcode = null) {
    try {
      const response = await axios.get(`${apiEndpoint}/search/?q=${q}${postcode ? `&postcode=${postcode}` : ""}`);
      return response.data;
    } catch (error) {
      console.error(`geo search error : ${q} ${postcode} ${error}`);
      return null;
    }
  }

  async searchPostcodeOnly(q, postcode = null) {
    try {
      const response = await axios.get(`${apiEndpoint}/search/?q=${q}${postcode ? `&postcode=${postcode}` : ""}`);
      return response.data;
    } catch (error) {
      console.error(`geo searchPostcodeOnly error : #${q}# ${postcode} ${error}`);
      return null;
    }
  }

  async searchMunicipalityByCode(code, isCityCode = false) {
    try {
      const { data } = await axios.get(`${apiEndpoint}/search/`, {
        params: {
          limit: 1,
          q: `${isCityCode ? "citycode=" : ""}${code}&type=municipality`,
        },
      });
      return data;
    } catch (e) {
      console.error("geo search municipality error", e);
      return e;
    }
  }
}

const apiGeoAdresse = new ApiGeoAdresse();
module.exports = apiGeoAdresse;
