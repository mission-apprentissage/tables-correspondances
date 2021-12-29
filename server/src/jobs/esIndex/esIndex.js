const { rebuildIndex } = require("../../common/utils/esUtils");
const {
  DomainesMetiers,
  BcnNMef,
  BcnNDispositifFormation,
  BcnNNiveauFormationDiplome,
  BcnLettreSpecialite,
  BcnFormationDiplome,
} = require("../../common/model/index");

const rebuildEsIndex = async (index, skipNotFound = false) => {
  switch (index) {
    case "domainesmetiers":
      await rebuildIndex(DomainesMetiers, { skipNotFound });
      break;
    case "bcn":
      await rebuildIndex(BcnNMef, { skipNotFound });
      await rebuildIndex(BcnNDispositifFormation, { skipNotFound });
      await rebuildIndex(BcnNNiveauFormationDiplome, { skipNotFound });
      await rebuildIndex(BcnLettreSpecialite, { skipNotFound });
      await rebuildIndex(BcnFormationDiplome, { skipNotFound });
      break;
    default:
      throw new Error("Index non géré");
  }
};

module.exports = { rebuildEsIndex };
