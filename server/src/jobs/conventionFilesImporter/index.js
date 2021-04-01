const logger = require("../../common/logger");
const { ConventionFile } = require("../../common/model");
const { runScript } = require("../scriptWrapper");
const importConventionFiles = require("./importConventionFiles");

const conventionFilesImporter = async () => {
  logger.info(`[Convention files importer] Starting...`);

  logger.info(`[Convention files importer] Removing files documents...`);
  await ConventionFile.deleteMany({});

  await importConventionFiles();
  logger.info(`[Convention files importer] Files imported`);
};

module.exports.conventionFilesImporter = conventionFilesImporter;

if (process.env.run) {
  runScript(() => {
    return conventionFilesImporter();
  });
}
