const axios = require("axios");

// Cf Documentation : https://doc.entreprise.api.gouv.fr/#param-tres-obligatoires
const apiEndpoint = "https://entreprise.api.gouv.fr/v2";
const apiParams = {
  token: process.env.TABLES_CORRESPONDANCES_API_ENTREPRISE_KEY,
  context: "Catalogue MNA",
  recipient: "12000101100010", // Siret Dinum
  object: "Consolidation des données du Catalogue MNA",
};

class ApiEntreprise {
  constructor() {}

  async getUnitesLegalesInfoFromSiren(siren) {
    try {
      const response = await axios.get(`${apiSireneV3Endpoint}/unites_legales/${siren}`, { params: apiParams });
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getEntrepriseInfoFromSiren(siren) {
    try {
      const response = await axios.get(`${apiEndpoint}/entreprises/${siren}`, { params: apiParams });
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getEntrepriseInfoFromSiret(siret) {
    try {
      const response = await axios.get(`${apiEndpoint}/etablissements/${siret}`, { params: apiParams });
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

const apiEntreprise = new ApiEntreprise();
module.exports = apiEntreprise;
