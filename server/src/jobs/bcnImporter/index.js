const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { runScript } = require("../scriptWrapper");
const fileManager = require("./FileManager");
const createBcnFormation = require("./createBcnFormation");
const updateBcnFormation = require("./updateBcnFormation");
const {
  BcnFormationDiplome,
  BcnLettreSpecialite,
  BcnNNiveauFormationDiplome,
  BcnNMef,
  BcnNDispositifFormation,
} = require("../../common/model/index");

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

const dbOperations = async (base, db, Entity, description = "") => {
  try {
    await asyncForEach(base, async (item) => {
      const exist = await Entity.findOne({ ID: item.ID });
      if (exist) {
        await Entity.findOneAndUpdate({ _id: item._id }, { ...item, last_update_at: Date.now() }, { new: true });
        logger.info(`BCN ${description} '${item.ID}' successfully updated in db ${db.name}`);
      } else {
        logger.info(`BCN ${description}  '${item.ID}' not found`);
        const bcnToAdd = new Entity(item);
        await bcnToAdd.save();
        logger.info(`BCN ${description} '${bcnToAdd._id}' successfully added in db ${db.name}`);
      }
    });
    logger.info(`Importing BCN ${description}  table Succeed`);
  } catch (error) {
    logger.error(`Importing BCN ${description}  table Failed`);
  }
};

const importBcnTables = async (db = { name: "" }) => {
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

  // N_LETTRE_SPECIALITE
  await dbOperations(bases.N_LETTRE_SPECIALITE, db, BcnLettreSpecialite, "Lettre specialite");

  // N_NIVEAU_FORMATION_DIPLOME
  await dbOperations(bases.N_NIVEAU_FORMATION_DIPLOME, db, BcnNNiveauFormationDiplome, "N Niveau formation");

  // N_MEF
  await dbOperations(bases.N_MEF, db, BcnNMef, "N Mef");

  // N_DISPOSITIF_FORMATION
  await dbOperations(bases.N_DISPOSITIF_FORMATION, db, BcnNDispositifFormation, "N Dispositif");

  logger.warn(`[BCN tables] Importer completed`);
};

module.exports.importBcnTables = importBcnTables;

if (process.env.run) {
  runScript(async ({ db }) => {
    await importBcnTables(db);
  });
}
