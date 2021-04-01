const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const importConventionFiles = require("./importConventionFiles");

const conventionFilesImporter = async (db) => {
  logger.info(`[Convention files importer] Starting...`);

  logger.info(`[Convention files importer] Removing files documents...`);
  await db.collection("conventionfiles").deleteMany({});

  await importConventionFiles(db);
  logger.info(`[Convention files importer] Files imported`);
};

module.exports.conventionFilesImporter = conventionFilesImporter;

if (process.env.run) {
  runScript(({ db }) => {
    return conventionFilesImporter(db);
  });
}
