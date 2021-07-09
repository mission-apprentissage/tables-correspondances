const { AnnuaireStats } = require("../../common/model");
const validateSources = require("./validateSources");
const buildMatrice = require("./buildMatrice");
const buildSimilarites = require("./buildSimilarites");

async function computeRecoupement(sources, fields, options) {
  let stats = {
    ...(options.validate ? { validation: await validateSources(sources) } : {}),
    matrice: await buildMatrice(sources, fields),
    similarites: await buildSimilarites(sources, fields),
  };

  if (options.save) {
    await AnnuaireStats.create(stats);
  }

  return stats;
}
module.exports = computeRecoupement;
