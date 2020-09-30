const { runScript } = require("./scriptWrapper");
const logger = require("../common/logger");
const downloadBcnTables = require("./bcnDownloader/index");

runScript(async () => {
  try {
    logger.info(`Start all jobs`);
    await downloadBcnTables();
  } catch (error) {
    logger.error(error);
  }
});
