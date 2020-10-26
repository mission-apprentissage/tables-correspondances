const logger = require("../../common/logger");
const { BcnFormationDiplome } = require("../../common/model/index");

module.exports = async (db, bcnFormation) => {
  try {
    const bcnFormationDiplomeToAdd = new BcnFormationDiplome(bcnFormation);
    await bcnFormationDiplomeToAdd.save();
    logger.info(`BCN Formation '${bcnFormationDiplomeToAdd.id}' successfully added in db ${db.name}`);
  } catch (err) {
    logger.error({ err });
  }
};
