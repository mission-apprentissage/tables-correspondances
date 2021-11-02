const { runScript } = require("./scriptWrapper");
const logger = require("../common/logger");
const { downloadBcnTables } = require("./bcnDownloader/index");
const { importBcnTables } = require("./bcnImporter/index");
const { conventionFilesImporter } = require("./convetionFilesImporter/index");
const { onisepImporter } = require("./OnisepImporter/index");
const { rncpImporter } = require("./rncpImporter/index");

runScript(async ({ db }) => {
  try {
    logger.info(`Start all jobs`);
    await downloadBcnTables();
    await importBcnTables(db);
    await onisepImporter(db);
    await conventionFilesImporter(db);
    await rncpImporter();
  } catch (error) {
    logger.error(error);
  }
});
