const { runScript } = require("./scriptWrapper");
const logger = require("../common/logger");
const downloadBcnTables = require("./bcnDownloader/index");
const importBcnTables = require("./bcnImporter/index");
const rncpImporter = require("./rncpImporter/index");
const EtablissementsUpdater = require("./EtablissementsUpdater/index");

runScript(async ({ db }) => {
  try {
    logger.info(`Start all jobs`);
    await downloadBcnTables();
    await importBcnTables(db);
    await rncpImporter();
    await EtablissementsUpdater();
  } catch (error) {
    logger.error(error);
  }
});
