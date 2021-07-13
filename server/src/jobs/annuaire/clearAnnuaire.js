const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");

module.exports = async () => {
  let res = await Annuaire.deleteMany({});
  return { deleted: getNbModifiedDocuments(res) };
};
