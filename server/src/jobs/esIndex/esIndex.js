const { rebuildIndex } = require("../../common/utils/esUtils");
const { Etablissement } = require("../../common/model/index");

const rebuildEsIndex = async (index, skipNotFound = false) => {
  switch (index) {
    case "etablissements":
      await rebuildIndex("etablissements", Etablissement, { skipNotFound });
      break;

    default:
      await rebuildIndex("etablissements", Etablissement);
  }
};

module.exports = { rebuildEsIndex };
