const { runScript } = require("./scriptWrapper");
const logger = require("../common/logger");
const { downloadBcnTables } = require("./bcnDownloader");
const { importBcnTables } = require("./bcnImporter");
const { conventionFilesImporter } = require("./conventionFilesImporter");
const { onisepImporter } = require("./OnisepImporter");
const { rncpImporter } = require("./rncpImporter");

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
