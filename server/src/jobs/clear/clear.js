const logger = require("../../common/logger");
const { rebuildIndex } = require("../../common/utils/esUtils");
const { BcnFormationDiplome, User } = require("../../common/model/index");

module.exports = async () => {
  logger.info("test");
  await BcnFormationDiplome.deleteMany({});
  await rebuildIndex("bcnformationdiplome", BcnFormationDiplome);

  await User.deleteMany({});
  logger.info(`All bcnformationdiplome deleted`);
  logger.info(`All users deleted`);
};
