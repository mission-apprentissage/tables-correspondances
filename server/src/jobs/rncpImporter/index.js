const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const importRNCP = require("./importRNCP");

/**
 * @param {string|null} [localPath=null]
 */
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
