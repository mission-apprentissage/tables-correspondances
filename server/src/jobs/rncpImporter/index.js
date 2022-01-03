const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const importRNCP = require("./importRNCP");

const rncpImporter = async (localPath = null) => {
  logger.info(`[RCNP importer] Starting`);

  await importRNCP(localPath);

  logger.info(`[RCNP importer] Ended`);
};

module.exports.rncpImporter = rncpImporter;

if (process.env.run) {
  runScript(async () => {
    await rncpImporter();
  });
}
