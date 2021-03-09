const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const importRNCP = require("./importRNCP");

const rncpImporter = async () => {
  logger.warn(`[RCNP importer] Starting`);

  await importRNCP();

  logger.warn(`[RCNP importer] Ended`);
};

module.exports.rncpImporter = rncpImporter;

if (process.env.run) {
  runScript(async () => {
    await rncpImporter();
  });
}
