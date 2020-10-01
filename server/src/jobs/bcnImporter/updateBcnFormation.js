const logger = require("../../common/logger");
const { NFormationDiplome } = require("../../common/model/index");

module.exports = async (db, id, nFormation) => {
  try {
    await NFormationDiplome.findOneAndUpdate({ _id: id }, { ...nFormation, last_update_at: Date.now() }, { new: true });
    logger.info(`BCN Formation '${nFormation.FORMATION_DIPLOME}' successfully updated in db ${db.name}`);
  } catch (err) {
    logger.error({ err });
  }
};
