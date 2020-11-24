const axios = require("axios");
const logger = require("../logger");
const endpoint = "https://c7a5ujgw35.execute-api.eu-west-3.amazonaws.com/prod";

module.exports = async () => {
  return {
    getEtablissements: async (options) => {
      try {
        let { page, allEtablissements, limit, query } = { page: 1, allEtablissements: [], limit: 1050, ...options };

        let params = { page, limit, query };
        logger.debug(`Requesting ${endpoint}/etablissements with parameters`, params);
        const response = await axios.get(`${endpoint}/etablissements`, { params });

        const { etablissements, pagination } = response.data;
        allEtablissements = allEtablissements.concat(etablissements); // Should be properly exploded, function should be pure

        if (page < pagination.nombre_de_page) {
          return this.getEtablissements({ page: page + 1, allEtablissements, limit });
        } else {
          return allEtablissements;
        }
      } catch (error) {
        logger.error(error);
        return null;
      }
    },
    getFormations: async (options) => {
      try {
        let { page, allFormations, limit } = { page: 1, allFormations: [], limit: 1050, ...options };

        let params = { page, limit };
        logger.info(`Requesting ${endpoint}/formations with parameters`, params);
        const response = await axios.get(`${endpoint}/formations`, { params });

        const { formations, pagination } = response.data;
        allFormations = allFormations.concat(formations); // Should be properly exploded, function should be pure

        if (page < pagination.nombre_de_page) {
          // if (page < 2) {
          return this.getFormations({ page: page + 1, allFormations });
        } else {
          return allFormations;
        }
      } catch (error) {
        logger.error(error);
        return null;
      }
    },
  };
};
