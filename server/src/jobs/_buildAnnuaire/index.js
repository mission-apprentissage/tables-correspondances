const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const importRefEa = require("./importRefEa");
const importSifaSiret = require("./importSifaSiret");
const importSifaLink = require("./importSifaLink");
const Exporter = require("./Exporter");

const run = async () => {
  logger.info(`Run Annuaire`);
  //await importRefEa();
  const toCheckManuallyDataSet1 = await importSifaSiret();
  const toCheckManuallyDataSet2 = await importSifaLink();

  const exporter = new Exporter();
  await exporter.toXlsx(toCheckManuallyDataSet1, "Set1.xlsx");
  await exporter.toXlsx(toCheckManuallyDataSet2, "Set2.xlsx");
};
module.exports = run;

if (process.env.run) {
  runScript(async () => {
    await run();
  });
}
