const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const importRefEa = require("./importRefEa");
const importSifaSiret = require("./importSifaSiret");
const importSifaLink = require("./importSifaLink");

const run = async () => {
  logger.info(`Run Annuaire`);
  await importRefEa();
  await importSifaSiret();
  await importSifaLink();
};
module.exports = run;

if (process.env.run) {
  runScript(async () => {
    await run();
  });
}
