// const logger = require("../../common/logger");
// const { runScript } = require("../scriptWrapper");
const importRNCP = require("./importRNCP");
const { getFileFromS3 } = require("../../common/utils/awsUtils");
const config = require("config");

const rncpImporter = async () => {
  // logger.warn(`[RCNP importer] Starting`);

  const fileInputStream = getFileFromS3(config.rncp.xml_path);
  console.log("importRNCP");
  await importRNCP(fileInputStream);

  // logger.warn(`[RCNP importer] Ended`);
};

module.exports = rncpImporter;

// if (process.env.run) {
//   runScript(async () => {
//     await rncpImporter();
//   });
// }
