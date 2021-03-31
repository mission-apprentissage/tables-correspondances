const config = require("config");
const path = require("path");
const { createWriteStream } = require("fs");
const XLSX = require("xlsx");
const { oleoduc } = require("oleoduc");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const importConventionFiles = require("./importConventionFiles");
const { downloadAndSaveFileFromS3 } = require("../../common/utils/awsUtils");
const { getJsonFromCsvFile, readXLSXFile } = require("../../common/utils/fileUtils");
const { getOvhFileAsStream } = require("../../common/utils/ovhUtils");

const downloadXlsxAndGetJson = async (filename) => {
  const localPath = path.join(__dirname, `./assets/${filename}`);

  let stream = await getOvhFileAsStream(`convention/${filename}`);
  await oleoduc(stream, createWriteStream(localPath));

  const datadockWb = readXLSXFile(localPath);
  return XLSX.utils.sheet_to_json(datadockWb.workbook.Sheets[datadockWb.sheet_name_list[0]]);
};

const conventionFilesImporter = async (db) => {
  logger.warn(`[Convention files importer] Starting...`);

  logger.info(`[Convention files importer] Removing files documents...`);
  await db.collection("conventionfiles").deleteMany({});
  logger.info(`[Convention files importer] Files have been removed successfully`);

  // CSV import
  const PUBLIC_OFS_PATH = path.join(__dirname, "./assets/latest_public_ofs.csv");
  await downloadAndSaveFileFromS3(`${config.conventionFiles.path}/latest_public_ofs.csv`, PUBLIC_OFS_PATH);
  const publicOfs = getJsonFromCsvFile(PUBLIC_OFS_PATH);

  // Xlsx import
  const datadock = await downloadXlsxAndGetJson("BaseDataDock-latest.xlsx");
  const depp = await downloadXlsxAndGetJson("CFASousConvRegionale_latest.xlsx");
  const dgefp = await downloadXlsxAndGetJson("DGEFP - Extraction au 10 01 2020.xlsx");

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
