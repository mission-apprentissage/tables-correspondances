const logger = require("../../common/logger");
const updater = require("./updater/updater");

const { runScript } = require("../scriptWrapper");

const EtablissementsUpdater = async () => {
  try {
    logger.info(" -- Start of etablissements updater -- ");

    await updater.run();

    logger.info(" -- End of etablissements updater -- ");
  } catch (err) {
    logger.error(err);
  }
};

module.exports = EtablissementsUpdater;

if (process.env.standalone) {
  runScript(async () => {
    await EtablissementsUpdater();
  });
}
