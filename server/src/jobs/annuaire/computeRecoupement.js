const { AnnuaireStats } = require("../../common/model");
const validateSources = require("./recoupement/validateSources");
const buildMatrice = require("./recoupement/buildMatrice");
const buildSimilarites = require("./recoupement/buildSimilarites");

async function computeRecoupement(sources, options) {
  let fields = options.fields || ["uai", "siret"];
  let stats = {
    ...(options.validate ? { validation: await validateSources(sources) } : {}),
    matrice: await buildMatrice(
      sources.filter((s) => ["deca", "catalogue", "ramsese", "sifa"].includes(s.name)),
      fields
    ),
    similarites: await buildSimilarites(
      sources.filter((s) => ["deca", "catalogue", "ramsese", "sifa"].includes(s.name)),
      fields
    ),
  };

  if (options.save) {
    await AnnuaireStats.create(stats);
  }

  return stats;
}
module.exports = computeRecoupement;
