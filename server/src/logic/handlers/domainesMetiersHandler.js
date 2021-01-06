const { getElasticInstance } = require("../../common/esClient");
const logger = require("../../common/logger");
const _ = require("lodash");

const getRomesAndLabelsFromTitleQuery = async (query, _esClient) => {
  if (!query.title) {
    logger.error("query parameter is missing; search cannot proceed");
    return { error: "title_missing" };
  }

  const romes = await getLabelsAndRomes(query.title, _esClient);
  return romes;
};

const getLabelsAndRomes = async (searchKeyword, _esClient) => {
  try {
    const esClient = _esClient ?? getElasticInstance();
    const response = await esClient.search({
      index: "domainesmetiers",
      size: 10,
      _sourceIncludes: ["sous_domaine", "codes_romes"],
      body: {
        query: {
          bool: {
            must: {
              multi_match: {
                query: searchKeyword,
                fields: [
                  "domaine^3",
                  "sous_domaine^20",
                  "domaines^1",
                  "familles^1",
                  "mots_clefs^3",
                  "intitules_romes^5",
                ],
                type: "phrase_prefix",
                operator: "or",
              },
            },
          },
        },
      },
    });

    let labelsAndRomes = [];

    response.body.hits.hits.forEach((labelAndRome) => {
      labelsAndRomes.push({ label: labelAndRome._source.sous_domaine, romes: labelAndRome._source.codes_romes });
    });

    return { labelsAndRomes };
  } catch (err) {
    let error_msg = _.get(err, "meta.body") ? err.meta.body : err.message;
    logger.error("Error getting romes from keyword ", error_msg);

    if (_.get(err, "meta.meta.connection.status") === "dead") {
      logger.error("Elastic search is down or unreachable");
    }

    return { error: error_msg };
  }
};

module.exports = { getRomesAndLabelsFromTitleQuery };
