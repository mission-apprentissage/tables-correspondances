const { runScript } = require("./scriptWrapper");
const logger = require("../common/logger");
const downloadBcnTables = require("./bcnDownloader/index");
const importBcnTables = require("./bcnImporter/index");

runScript(async ({ db }) => {
  try {
    logger.info(`Start all jobs`);
    await downloadBcnTables();
    await importBcnTables(db);
  } catch (error) {
    logger.error(error);
  }
});
