const logger = require("../../common/logger");
const { rebuildIndex } = require("../../common/utils/esUtils");
const { NFormationDiplome, User } = require("../../common/model/index");

module.exports = async () => {
  logger.info("test");
  await NFormationDiplome.deleteMany({});
  await rebuildIndex("nformationdiplome", NFormationDiplome);

  await User.deleteMany({});
  logger.info(`All NFormationDiplomes deleted`);
  logger.info(`All users deleted`);
};
