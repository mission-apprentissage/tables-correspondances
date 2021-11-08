const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const importConventionFiles = require("./importConventionFiles");
const { downloadAndSaveFileFromS3 } = require("../../common/utils/awsUtils");
const { getJsonFromCsvFile, readXLSXFile, downloadFile } = require("../../common/utils/fileUtils");
const config = require("config");
const path = require("path");
const XLSX = require("xlsx");

const downloadXlsxAndGetJson = async (assetsDir, filename, download = true) => {
  const local_path = path.join(assetsDir, filename);
  if (download) {
    try {
      await downloadAndSaveFileFromS3(`${config.conventionFiles.path}/${filename}`, local_path);
    } catch (e) {
      logger.error(`unable to download file ${filename}`, e);
    }
  }
  const datadockWb = readXLSXFile(local_path);
  return XLSX.utils.sheet_to_json(datadockWb.workbook.Sheets[datadockWb.sheet_name_list[0]]);
};

const conventionFilesImporter = async (db, assetsDir = path.join(__dirname, "./assets")) => {
  logger.warn(`[Convention files importer] Starting`);

  // CSV import
  const PUBLIC_OFS_PATH = path.join(assetsDir, "latest_public_ofs.csv");
  try {
    await downloadFile("https://www.data.gouv.fr/fr/datasets/r/745a5413-d2b5-4d61-b743-8b0ace68083b", PUBLIC_OFS_PATH); // latest_public_ofs.csv
  } catch (e) {
    logger.error("unable to download ofs file", e);
  }
  const publicOfs = getJsonFromCsvFile(PUBLIC_OFS_PATH);

  const DEPP_PATH = path.join(assetsDir, "CFASousConvRegionale_latest-UAI.csv");
  const depp = getJsonFromCsvFile(DEPP_PATH);

  const Datadock_PATH = path.join(assetsDir, "BaseDataDock-latest.csv");
  const datadock = getJsonFromCsvFile(Datadock_PATH, ",");

  // Xlsx import
  const dgefp = await downloadXlsxAndGetJson(assetsDir, "DGEFP - Extraction au 10 01 2020.xlsx");

  logger.info(`[Convention files importer] removing conventionfiles documents`);
  await db.collection("conventionfiles").deleteMany({});
  logger.info(`[Convention files importer] Removing successfull`);
  // Push into Db
  await importConventionFiles(db, publicOfs, datadock, depp, dgefp);

  logger.warn(`[Convention files importer] Ended`);
};

module.exports.conventionFilesImporter = conventionFilesImporter;

if (process.env.run) {
  runScript(async ({ db }) => {
    await conventionFilesImporter(db);
  });
}
