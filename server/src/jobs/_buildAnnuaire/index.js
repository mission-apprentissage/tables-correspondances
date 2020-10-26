const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { runScript } = require("../scriptWrapper");
const fileManager = require("./FileManager");
//const createBcnFormation = require("./createBcnFormation");
//const updateBcnFormation = require("./updateBcnFormation");
const { AnnuaireEtablissement } = require("../../common/model/index");

const buildAnnuaireEtablissements = async (db) => {
  logger.warn(`[Annuaire] Building`);
  const bases = fileManager.loadBases();

  // load agri base

  try {
    await asyncForEach(bases, async (formation) => {
      const exist = await AnnuaireEtablissement.findOne({ FORMATION_DIPLOME: formation.FORMATION_DIPLOME });
      // if (exist) {
      //   await updateBcnFormation(db, exist._id, formation);
      // } else {
      //   logger.info(`BCN Formation '${formation.FORMATION_DIPLOME}' not found`);
      //   await createBcnFormation(db, formation);
      // }
    });
    logger.info(`Build from agriculture Succeed`);
  } catch (error) {
    logger.error(`Build from agriculture Failed`);
  }

  // TODO OTHER TABLES

  logger.warn(`[Annuaire] Build completed`);
};

module.exports = buildAnnuaireEtablissements;

if (process.env.run) {
  runScript(async ({ db }) => {
    await buildAnnuaireEtablissements(db);
  });
}
