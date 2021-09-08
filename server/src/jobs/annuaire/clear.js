const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const logger = require("../../common/logger");

async function clear() {
  logger.warn("Suppresion de tous les établissements de l'annuaire...");
  let res = await Annuaire.deleteMany({});
  return { deleted: getNbModifiedDocuments(res) };
}

module.exports = clear;
