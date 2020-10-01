const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { runScript } = require("../scriptWrapper");
const fileManager = require("./FileManager");
const createNformation = require("./createNformation");
const updateNformation = require("./updateNformation");
const { NFormationDiplome } = require("../../common/model/index");

const importBcnTables = async (db) => {
  logger.warn(`[BCN tables] Importer`);
  const bases = fileManager.loadBases();

  try {
    await asyncForEach(bases.N_FORMATION_DIPLOME, async (nFormation) => {
      const exist = await NFormationDiplome.findOne({ FORMATION_DIPLOME: nFormation.FORMATION_DIPLOME });
      if (exist) {
        await updateNformation(db, exist._id, nFormation);
      } else {
        logger.info(`NFormationDiplome '${nFormation.FORMATION_DIPLOME}' not found`);
        await createNformation(db, nFormation);
      }
    });
    logger.info(`Importing N_FORMATION_DIPLOME table Succeed`);
  } catch (error) {
    logger.error(`Importing N_FORMATION_DIPLOME table Failed`);
  }

  // TODO OTHER TABLES

  logger.warn(`[BCN tables] Importer completed`);
};

module.exports = importBcnTables;

if (process.env.run) {
  runScript(async ({ db }) => {
    await importBcnTables(db);
  });
}
