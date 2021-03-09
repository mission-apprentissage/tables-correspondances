const { uniqBy } = require("lodash/array");
const { CodeIdccOpco, CodeEnCodesIdcc } = require("../../common/model/index");

const findOpcosFromIdccs = async (idccs = []) => {
  return await CodeIdccOpco.find({ IDCC: { $in: idccs } }, { _id: 0, __v: 0 }).lean();
};

const findIdccsFromCfd = async (cfd) => {
  const codesIdcc = await CodeEnCodesIdcc.distinct("codeIDCC", { cfd: cfd, statut: "CPNE" });
  if (codesIdcc.length > 0) {
    const result = codesIdcc.join(",").replace(/\s/g, "").split(",");
    return [...new Set(result)];
  }

  return [];
};

const findOpcosFromCfd = async (cfd) => {
  const codesIdcc = await findIdccsFromCfd(cfd);
  const opcos = await findOpcosFromIdccs(codesIdcc);
  return uniqBy(opcos, "operateur_de_competences");
};

module.exports = { findOpcosFromIdccs, findIdccsFromCfd, findOpcosFromCfd };
