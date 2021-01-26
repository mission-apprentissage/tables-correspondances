const logger = require("../../common/logger");
const updater = require("./updater/updater");
const commandLineArgs = require("command-line-args");

const { runScript } = require("../scriptWrapper");

const optionDefinitions = [
  { name: "filter", alias: "f", type: String, defaultValue: "{}" },
  { name: "withHistoryUpdate", alias: "h", type: Boolean, defaultValue: true },
  { name: "siret", alias: "s", type: Boolean, defaultValue: false },
  { name: "location", alias: "l", type: Boolean, defaultValue: false },
  { name: "geoloc", alias: "g", type: Boolean, defaultValue: false },
  { name: "conventionnement", alias: "c", type: Boolean, defaultValue: false },
];
// Usage
// Only conventionnment -c
// Only siret -s
// Only location and geoloc -lg
const EtablissementsUpdater = async () => {
  try {
    logger.info(" -- Start of etablissements updater -- ");

    const optionsCmd = commandLineArgs(optionDefinitions);

    const all = !optionsCmd.siret && !optionsCmd.location && !optionsCmd.geoloc && !optionsCmd.conventionnement;

    const filter = JSON.parse(optionsCmd.filter);

    let options = {
      withHistoryUpdate: optionsCmd.withHistoryUpdate,
      scope: all
        ? {
            siret: true,
            location: true,
            geoloc: true,
            conventionnement: true,
          }
        : {
            siret: optionsCmd.siret,
            location: optionsCmd.location,
            geoloc: optionsCmd.geoloc,
            conventionnement: optionsCmd.conventionnement,
          },
    };
    await updater.run(filter, options);

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
