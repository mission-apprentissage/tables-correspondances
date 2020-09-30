const logger = require("../../common/logger");
const { NFormationDiplome } = require("../../common/model/index");

module.exports = async (db, nFormation) => {
  try {
    const nFormationDiplomeToAdd = new NFormationDiplome(nFormation);
    await nFormationDiplomeToAdd.save();
    logger.info(`NFormationDiplome '${nFormationDiplomeToAdd.id}' successfully added in db ${db.name}`);
  } catch (err) {
    logger.error({ err });
  }
};
