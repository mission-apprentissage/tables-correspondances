const config = require("config");
const path = require("path");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { getJsonFromCsvFile, downloadFile } = require("../../common/utils/fileUtils");
const { ConventionFile } = require("../../common/model");
const importConventionFiles = require("./importConventionFiles");

const conventionFilesImporter = async (assetsDir = path.join(__dirname, "./assets")) => {
  logger.info(`[Convention files importer] Starting`);

  // CSV import
  const PUBLIC_OFS_PATH = path.join(assetsDir, "latest_public_ofs.csv");

  await downloadFile(config.ofsFile, PUBLIC_OFS_PATH);
  const publicOfs = getJsonFromCsvFile(PUBLIC_OFS_PATH);

  logger.info(`[Convention files importer] removing conventionfiles documents`);
  await ConventionFile.deleteMany({});
  logger.info(`[Convention files importer] Removing successfull`);
  // Push into Db
  await importConventionFiles(publicOfs);

  logger.info(`[Convention files importer] Ended`);
};

module.exports.conventionFilesImporter = conventionFilesImporter;

if (process.env.run) {
  runScript(async () => {
    await conventionFilesImporter();
  });
}
