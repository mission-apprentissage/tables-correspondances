const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const apiOnisep = require("../../common/apis/apiOnisep");

const onisepImporter = async (db) => {
  logger.warn(`[Onisep importer] Starting`);

  logger.info(`[Onisep importer] removing onisep documents`);
  await db.collection("onisep").deleteMany({});
  logger.info(`[Onisep importer] Removing successfull`);

  const etablissements = await apiOnisep.getAllEtablissements();
  const formations = await apiOnisep.getAllFormations();

  await db.collection("onisep").insertMany(etablissements.map((d) => ({ ...d, type: "etablissement" })));
  await db.collection("onisep").insertMany(formations.map((d) => ({ ...d, type: "formation" })));

  logger.warn(`[Onisep importer] Ended`);
};

module.exports.onisepImporter = onisepImporter;

if (process.env.run) {
  runScript(async ({ db }) => {
    await onisepImporter(db);
  });
}
