const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { BcnFormationDiplome } = require("../../common/model");

runScript(async ({ db }) => {
  const nbBcnFormationDiplomeEntities = await BcnFormationDiplome.countDocuments({});
  logger.info(`Db ${db.name} - NFormationDiplome count : ${nbBcnFormationDiplomeEntities}`);
});
