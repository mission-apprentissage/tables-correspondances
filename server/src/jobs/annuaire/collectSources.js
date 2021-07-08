const { oleoduc, writeData, filterData } = require("oleoduc");
const { uniq, isEmpty } = require("lodash");
const mergeStream = require("merge-stream");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { flattenObject, isError } = require("../../common/utils/objectUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

function buildQuery(selector) {
  if (isEmpty(selector)) {
    return { not: "matching" };
  }

  return typeof selector === "object" ? selector : { $or: [{ siret: selector }, { "uais.uai": selector }] };
}

function buildUAIs(from, etablissement, uais) {
  let updated = uais
    .filter((uai) => uai && uai !== "NULL")
    .reduce((acc, uai) => {
      let found = etablissement.uais.find((u) => u.uai === uai) || {};
      let sources = uniq([...(found.sources || []), from]);
      acc.push({ ...found, uai, sources, valide: validateUAI(uai) });
      return acc;
    }, []);

  let previous = etablissement.uais.filter((us) => !updated.map(({ uai }) => uai).includes(us.uai));

  return [...updated, ...previous];
}

async function buildRelations(from, etablissement, relations) {
  let updated = relations.reduce((acc, relation) => {
    let found = etablissement.relations.find((r) => r.siret === relation.siret) || {};
    let sources = uniq([...(found.sources || []), from]);
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

function handleAnomalies(from, etablissement, anomalies) {
  logger.error(`[Collect][${from}] Erreur lors de la collecte pour l'établissement ${etablissement.siret}.`, anomalies);

  return Annuaire.updateOne(
    { siret: etablissement.siret },
    {
      $push: {
        "_meta.anomalies": {
          $each: anomalies.map((ano) => {
            return {
              job: "collect",
              source: from,
              date: new Date(),
              code: isError(ano) ? "erreur" : ano.code,
              details: ano.message,
            };
          }),
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
        ignored: 0,
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
    writeData(async ({ from, selector, uais = [], relations = [], reseaux = [], data = {}, anomalies = [] }) => {
      stats[from].total++;
      let query = buildQuery(selector);
      let etablissement = await Annuaire.findOne(query).lean();
      if (!etablissement) {
        stats[from].ignored++;
        return;
      }

      try {
        if (anomalies.length > 0) {
          stats[from].failed++;
          await handleAnomalies(from, etablissement, anomalies);
        }

        let res = await Annuaire.updateOne(
          query,
          {
            $set: {
              ...flattenObject(data),
              uais: buildUAIs(from, etablissement, uais),
              relations: await buildRelations(from, etablissement, relations),
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
          stats[from].updated += nbModifiedDocuments;
          logger.debug(`[Annuaire][Collect][${from}] Etablissement ${etablissement.siret} updated`);
        }
      } catch (e) {
        stats[from].failed++;
        await handleAnomalies(from, etablissement, [e]);
      }
    })
  );

  return stats;
};
