const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const apiOnisep = require("../../common/apis/apiOnisep");
const { Onisep } = require("../../common/model");

const onisepImporter = async () => {
  logger.info(`[Onisep importer] Starting`);

  logger.info(`[Onisep importer] removing onisep documents`);
  await Onisep.deleteMany({});
  logger.info(`[Onisep importer] Removing successfull`);

  const etablissements = await apiOnisep.getAllEtablissements();
  const formations = await apiOnisep.getAllFormations();

  await Onisep.insertMany(etablissements.map((d) => ({ ...d, type: "etablissement" })));
  await Onisep.insertMany(formations.map((d) => ({ ...d, type: "formation" })));

  logger.info(`[Onisep importer] Ended`);
};

module.exports.onisepImporter = onisepImporter;

if (process.env.run) {
  runScript(async ({ db }) => {
    await onisepImporter(db);
  });
}
