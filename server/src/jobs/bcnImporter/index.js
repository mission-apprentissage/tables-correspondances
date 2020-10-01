const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { runScript } = require("../scriptWrapper");
const fileManager = require("./FileManager");
const createBcnFormation = require("./createBcnFormation");
const updateBcnFormation = require("./updateBcnFormation");
const { BcnFormationDiplome } = require("../../common/model/index");

const mergeNformationVformation = (N_FORMATION_DIPLOME, V_FORMATION_DIPLOME) => {
  const bcnFormations = new Map();
  for (let ite = 0; ite < N_FORMATION_DIPLOME.length; ite++) {
    const nFormation = N_FORMATION_DIPLOME[ite];
    bcnFormations.set(nFormation.FORMATION_DIPLOME, nFormation);
  }
  for (let ite = 0; ite < V_FORMATION_DIPLOME.length; ite++) {
    const vFormation = V_FORMATION_DIPLOME[ite];
    const existInNFormation = bcnFormations.get(vFormation.FORMATION_DIPLOME);
    if (!existInNFormation) {
      bcnFormations.set(vFormation.FORMATION_DIPLOME, vFormation);
    }
  }
  return Array.from(bcnFormations.values());
};

const importBcnTables = async (db) => {
  logger.warn(`[BCN tables] Importer`);
  const bases = fileManager.loadBases();

  const bcnFormations = mergeNformationVformation(bases.N_FORMATION_DIPLOME, bases.V_FORMATION_DIPLOME);

  try {
    await asyncForEach(bcnFormations, async (formation) => {
      const exist = await BcnFormationDiplome.findOne({ FORMATION_DIPLOME: formation.FORMATION_DIPLOME });
      if (exist) {
        await updateBcnFormation(db, exist._id, formation);
      } else {
        logger.info(`BCN Formation '${formation.FORMATION_DIPLOME}' not found`);
        await createBcnFormation(db, formation);
      }
    });
    logger.info(`Importing BCN Formations table Succeed`);
  } catch (error) {
    logger.error(`Importing BCN Formations table Failed`);
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
