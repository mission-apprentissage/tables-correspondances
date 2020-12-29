const { uniqBy } = require("lodash/array");
const { CodeIdccOpco, CodeEnCodesIdcc } = require("../../common/model/index");

const findOpcosFromIdccs = async (idccs = []) => {
  return await CodeIdccOpco.find({ IDCC: { $in: idccs } });
};

const findIdccsFromCfd = async (cfd) => {
  let result = [];

  const found = await CodeEnCodesIdcc.find({ cfd: cfd, statut: "CPNE" });
  if (found.length > 0) {
    // Joining all idccs in one list without empty spaces
    const allIdccs = found
      .map(({ codeIDCC }) => codeIDCC)
      .join(",")
      .replace(/\s/g, "")
      .split(",");

    result = [...new Set(allIdccs)]; // return all uniques idccs
  }
  return result;
};

const findOpcosFromCfd = async (cfd) => {
  const codesIdcc = await findIdccsFromCfd(cfd);
  const opcos = await findOpcosFromIdccs(codesIdcc);
  return uniqBy(opcos, "operateur_de_competences");
};

module.exports = { findOpcosFromIdccs, findIdccsFromCfd, findOpcosFromCfd };
