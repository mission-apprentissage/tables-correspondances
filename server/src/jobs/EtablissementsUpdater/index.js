const logger = require("../../common/logger");
const updater = require("./updater/updater");
const { Etablissement } = require("../../common/model/index");

const { runScript } = require("../scriptWrapper");

const EtablissementsUpdater = async () => {
  try {
    logger.info(" -- Start of etablissements updater -- ");

    await updater.run(Etablissement);

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
