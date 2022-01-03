const logger = require("../../common/logger");
const { BcnFormationDiplome, User } = require("../../common/model/index");

module.exports = async () => {
  await BcnFormationDiplome.deleteMany({});

  await User.deleteMany({});
  logger.info(`All bcnformationdiplome deleted`);
  logger.info(`All users deleted`);
};
