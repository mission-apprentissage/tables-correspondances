const path = require("path");
const logger = require("../../common/logger");
const { downloadFile } = require("../../common/utils/fileUtils");
const { runScript } = require("../scriptWrapper");

const buildUrl = (table) => {
  const baseBCNurl = `http://infocentre.pleiade.education.fr/bcn/index.php/export/CSV?n=#TABLE_NAME#&idQuery=&actionBase=http%3A%2F%2Finfocentre.pleiade.education.fr%2Fbcn%2Findex.php%2Fexport%2FCSV&separator=%3B`;
  return baseBCNurl.replace("#TABLE_NAME#", table);
};

const downloadBcnTable = async (table) => {
  const toFile = path.resolve(__dirname, `../../logic/assets/bcnTables/${table.toLowerCase()}.csv`);
  await downloadFile(buildUrl(table), toFile);
};

runScript(async () => {
  logger.info(`Starting BCN tables download`);
  await downloadBcnTable("N_FORMATION_DIPLOME");
  await downloadBcnTable("V_FORMATION_DIPLOME");
  await downloadBcnTable("N_NIVEAU_FORMATION_DIPLOME");
  await downloadBcnTable("N_MEF");
  await downloadBcnTable("N_LETTRE_SPECIALITE");
  await downloadBcnTable("N_DISPOSITIF_FORMATION");
  logger.info(`BCN tables download completed`);
});
