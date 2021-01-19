const { rebuildIndex } = require("../../common/utils/esUtils");
const { Etablissement, DomainesMetiers } = require("../../common/model/index");

const rebuildEsIndex = async (index, skipNotFound = false) => {
  switch (index) {
    case "etablissements":
      await rebuildIndex("etablissements", Etablissement, { skipNotFound });
      break;
    case "domainesmetiers":
      await rebuildIndex("domainesmetiers", DomainesMetiers, { skipNotFound });
      break;
    default:
      throw new Error("Index non géré");
  }
};

module.exports = { rebuildEsIndex };
