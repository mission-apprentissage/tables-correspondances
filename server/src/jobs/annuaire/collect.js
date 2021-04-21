const { oleoduc, writeData, filterData } = require("oleoduc");
const { uniq, isEmpty } = require("lodash");
const mergeStream = require("merge-stream");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { flattenObject } = require("../../common/utils/objectUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

function buildQuery(selector) {
  if (typeof selector === "object") {
    if (isEmpty(selector)) {
      throw new Error("Select must not be empty");
    }
    return selector;
  }

  return { $or: [{ siret: selector }, { "uais.uai": selector }] };
}

function buildUAIs(source, etablissement, uais) {
  let updated = uais
    .filter((uai) => uai && uai !== "NULL")
    .reduce((acc, uai) => {
      let found = etablissement.uais.find((u) => u.uai === uai) || {};
      let sources = uniq([...(found.sources || []), source]);
      acc.push({ ...found, uai, sources, valide: validateUAI(uai) });
      return acc;
    }, []);

  let previous = etablissement.uais.filter((us) => !updated.map(({ uai }) => uai).includes(us.uai));

  return [...updated, ...previous];
}

async function buildRelations(source, etablissement, relations) {
  let updated = relations.reduce((acc, relation) => {
    let found = etablissement.relations.find((r) => r.siret === relation.siret) || {};
    let sources = uniq([...(found.sources || []), source]);
    acc.push({ ...found, ...relation, sources });
    return acc;
  }, []);

  let previous = etablissement.relations.filter((r) => !updated.map(({ siret }) => siret).includes(r.siret));

  return Promise.all(
    [...updated, ...previous].map(async (r) => {
      let count = await Annuaire.countDocuments({ siret: r.siret });
      return {
        ...r,
        annuaire: count > 0,
      };
    })
  );
}

function handleAnomalies(etablissement, source, anomalies) {
  logger.error(
    `[Collect][${source}] Erreur lors de la collecte pour l'établissement ${etablissement.siret}.`,
    anomalies
  );

  return Annuaire.updateOne(
    { siret: etablissement.siret },
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

  let streams = await Promise.all(sources.map((source) => source.stream({ filters })));

  await oleoduc(
    mergeStream(streams),
    filterData((data) => {
      return filters.siret ? filters.siret === data.selector : !!data;
    }),
    writeData(async ({ source, selector, uais = [], relations = [], reseaux = [], data = {}, anomalies = [] }) => {
      stats[source].total++;
      let query = buildQuery(selector);
      let etablissement = await Annuaire.findOne(query).lean();
      if (!etablissement) {
        return;
      }

      try {
        if (anomalies.length > 0) {
          stats[source].failed++;
          await handleAnomalies(etablissement, source, anomalies);
        }

        let res = await Annuaire.updateOne(
          query,
          {
            $set: {
              ...flattenObject(data),
              uais: buildUAIs(source, etablissement, uais),
              relations: await buildRelations(source, etablissement, relations),
            },
            $addToSet: {
              reseaux: {
                $each: reseaux,
              },
            },
          },
          { runValidators: true }
        );

        let nbModifiedDocuments = getNbModifiedDocuments(res);
        if (nbModifiedDocuments) {
          stats[source].updated += nbModifiedDocuments;
          logger.info(`[Annuaire][Collect][${source}] Etablissement ${etablissement.siret} updated`);
        } else {
          logger.debug(`[Annuaire][Collect][${source}] Etablissement ${etablissement.siret} ignored`);
        }
      } catch (e) {
        stats[source].failed++;
        await handleAnomalies(etablissement, source, [e]);
      }
    })
  );

  return stats;
};
