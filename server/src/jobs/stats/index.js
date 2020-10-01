const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { NFormationDiplome } = require("../../common/model");

runScript(async ({ db }) => {
  const nbNFormationDiplomeEntities = await NFormationDiplome.countDocuments({});
  logger.info(`Db ${db.name} - NFormationDiplome count : ${nbNFormationDiplomeEntities}`);
});
