const { oleoduc, writeData, filterData } = require("oleoduc");
const mergeStream = require("merge-stream");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { flattenObject } = require("../../common/utils/objectUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

function buildQuery(selector) {
  return { $or: [{ siret: selector }, { uai: selector }, { "uais_secondaires.uai": selector }] };
}

function buildNewUAIsSecondaires(source, etablissement, uais) {
  return uais
    .filter((uai) => uai && uai !== "NULL" && etablissement.uai !== uai)
    .map((uai) => {
      return { source, uai, valide: validateUAI(uai) };
    });
}

async function buildNewRelations(source, relations) {
  return Promise.all(
    relations.map(async (r) => {
      let doc = await Annuaire.findOne({ siret: r.siret });
      return { ...r, annuaire: !!doc, source };
    })
  );
}

async function handleAnomalies(source, selector, anomalies) {
  logger.error(`[Collect][${source}] Erreur lors de la collecte pour l'établissement ${selector}.`, anomalies);
  let query = buildQuery(selector);

  await Annuaire.updateOne(
    query,
    {
      $push: {
        "_meta.anomalies": {
          $each: anomalies.map((a) => ({
            task: "collect",
            source,
            date: new Date(),
            details: a.message || a,
          })),
          // Max 10 elements ordered by date
          $slice: 10,
          $sort: { date: -1 },
        },
      },
    },
    { runValidators: true }
  );
}

function createStats(sources) {
  return sources.reduce((acc, source) => {
    return {
      ...acc,
      [source.name]: {
        total: 0,
        updated: 0,
        failed: 0,
      },
    };
  }, {});
}

function parseArgs(...args) {
  let options = typeof args[args.length - 1].stream !== "function" ? args.pop() : {};

  let rest = args.pop();
  return {
    sources: Array.isArray(rest) ? rest : [rest],
    options,
  };
}

module.exports = async (...args) => {
  let { sources, options } = parseArgs(...args);
  let filters = options.filters || {};
  let stats = createStats(sources);

  let streams = sources.map((source) => source.stream({ filters }));

  await oleoduc(
    mergeStream(streams),
    filterData((data) => {
      return filters.siret ? filters.siret === data.selector : !!data;
    }),
    writeData(async ({ source, selector, uais = [], relations = [], reseaux = [], data = {}, anomalies = [] }) => {
      stats[source].total++;
      let query = buildQuery(selector);

      try {
        let etablissement = await Annuaire.findOne(query).lean();
        if (!etablissement) {
          return;
        }

        if (anomalies.length > 0) {
          stats[source].failed++;
          await handleAnomalies(source, selector, anomalies);
        }

        let res = await Annuaire.updateOne(
          query,
          {
            $set: {
              ...flattenObject(data),
            },
            $addToSet: {
              reseaux: {
                $each: reseaux,
              },
              relations: {
                $each: await buildNewRelations(source, relations),
              },
              uais_secondaires: {
                $each: buildNewUAIsSecondaires(source, etablissement, uais),
              },
            },
          },
          { runValidators: true }
        );
        let nbModifiedDocuments = getNbModifiedDocuments(res);
        if (nbModifiedDocuments) {
          stats[source].updated += nbModifiedDocuments;
          logger.debug(`[Collect][${source}] Etablissement ${selector} updated`);
        }
      } catch (e) {
        stats[source].failed++;
        await handleAnomalies(source, selector, [e]);
      }
    })
  );

  return stats;
};
