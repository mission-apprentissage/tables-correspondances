const { AnnuaireStats } = require("../../common/model");
const validateSources = require("./validateSources");
const buildMatrice = require("./buildMatrice");
const buildSimilarites = require("./buildSimilarites");

async function computeRecoupement(sources, options) {
  let fields = options.fields || ["uai", "siret"];
  let stats = {
    ...(options.validate ? { validation: await validateSources(sources) } : {}),
    matrice: await buildMatrice(
      sources.filter((s) => ["deca", "etablissements", "ramsese", "sifa"].includes(s.name)),
      fields
    ),
    similarites: await buildSimilarites(
      sources.filter((s) => ["deca", "etablissements", "ramsese", "sifa"].includes(s.name)),
      fields
    ),
  };

  if (options.save) {
    await AnnuaireStats.create(stats);
  }

  return stats;
}
module.exports = computeRecoupement;
