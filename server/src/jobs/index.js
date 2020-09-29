const logger = require("../common/logger");

const run = async () => {
  try {
    logger.info(`Run Jobs`);
  } catch (error) {
    logger.error(error);
  }
};

run();
