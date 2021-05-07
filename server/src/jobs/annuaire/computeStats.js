const { oleoduc, accumulateData, writeData } = require("oleoduc");
const { uniq } = require("lodash");
const { Annuaire, AnnuaireStats } = require("../../common/model");
const { promiseAllProps } = require("../../common/utils/asyncUtils");
const { getDefaultReferentiels, createReferentiel } = require("./referentiels/referentiels");

async function computeReferentielStats(referentiel) {
  let stats;
  await oleoduc(
    referentiel.stream(),
    accumulateData(
      (acc, siret) => {
        return {
          sirens: uniq([...acc.sirens, siret.substring(0, 9)]),
          sirets: uniq([...acc.sirets, siret]),
        };
      },
      { accumulator: { sirens: [], sirets: [] } }
    ),
    writeData((acc) => {
      stats = {
        name: referentiel.name,
        nbSirens: acc.sirens.length,
        nbSirets: acc.sirets.length,
      };
    })
  );

  return stats;
}

function computeAnnuaireStats(groupBy) {
  console.log("%j", [
    {
      $group: {
        ...groupBy,
        sirens: { $addToSet: { $substr: ["$siret", 0, 9] } },
        nbSirets: { $sum: 1 },
        nbSiretsGestionnairesEtFormateurs: {
          $sum: {
            $cond: {
              if: { $and: [{ $eq: ["$gestionnaire", true] }, { $eq: ["$formateur", true] }] },
              then: 1,
              else: 0,
            },
          },
        },
        nbSiretsGestionnaires: {
          $sum: {
            $cond: {
              if: { $and: [{ $eq: ["$gestionnaire", true] }, { $ne: ["$formateur", true] }] },
              then: 1,
              else: 0,
            },
          },
        },
        nbSiretsFormateurs: {
          $sum: {
            $cond: {
              if: { $and: [{ $ne: ["$gestionnaire", true] }, { $eq: ["$formateur", true] }] },
              then: 1,
              else: 0,
            },
          },
        },
        nbSiretsSansUAIs: { $sum: { $cond: { if: { $eq: [{ $size: "$uais" }, 0] }, then: 1, else: 0 } } },
        nbSiretsAvecPlusieursUAIs: { $sum: { $cond: { if: { $gt: [{ $size: "$uais" }, 0] }, then: 1, else: 0 } } },
      },
    },
    {
      $addFields: {
        nbSirens: { $size: "$sirens" },
      },
    },
    {
      $unset: ["sirens", "_id"],
    },
    {
      $sort: { "academie.nom": 1 },
    },
  ]);
  return Annuaire.aggregate([
    {
      $group: {
        ...groupBy,
        sirens: { $addToSet: { $substr: ["$siret", 0, 9] } },
        nbSirets: { $sum: 1 },
        nbSiretsGestionnairesEtFormateurs: {
          $sum: {
            $cond: {
              if: { $and: [{ $eq: ["$gestionnaire", true] }, { $eq: ["$formateur", true] }] },
              then: 1,
              else: 0,
            },
          },
        },
        nbSiretsGestionnaires: {
          $sum: {
            $cond: {
              if: { $and: [{ $eq: ["$gestionnaire", true] }, { $ne: ["$formateur", true] }] },
              then: 1,
              else: 0,
            },
          },
        },
        nbSiretsFormateurs: {
          $sum: {
            $cond: {
              if: { $and: [{ $ne: ["$gestionnaire", true] }, { $eq: ["$formateur", true] }] },
              then: 1,
              else: 0,
            },
          },
        },
        nbSiretsSansUAIs: { $sum: { $cond: { if: { $eq: [{ $size: "$uais" }, 0] }, then: 1, else: 0 } } },
        nbSiretsAvecPlusieursUAIs: { $sum: { $cond: { if: { $gt: [{ $size: "$uais" }, 0] }, then: 1, else: 0 } } },
      },
    },
    {
      $addFields: {
        nbSirens: { $size: "$sirens" },
      },
    },
    {
      $unset: ["sirens", "_id"],
    },
    {
      $sort: { "academie.nom": 1 },
    },
  ]);
}

async function computeStats(options = {}) {
  let referentiels = options.referentiels || (await Promise.all(getDefaultReferentiels().map(createReferentiel)));

  let stats = await promiseAllProps({
    referentiels: Promise.all(referentiels.map((r) => computeReferentielStats(r))),
    globale: computeAnnuaireStats({
      _id: null,
    }).then((res) => res[0]),
    academies: computeAnnuaireStats({
      _id: "$academie.code",
      academie: { $first: "$academie" },
    }),
  });

  await AnnuaireStats.create(stats);

  return stats;
}
module.exports = computeStats;
