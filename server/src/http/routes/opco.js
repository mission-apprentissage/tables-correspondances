const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { CodeIdccOpco } = require("../../common/model/index");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/opcosFromIdccs",
    tryCatch(async (req, res) => {
      const { idccs = [] } = req.query;
      const result = await CodeIdccOpco.find({ IDCC: { $in: idccs } });
      return res.json(result);
    })
  );

  return router;
};

// /**
//  * Find Idccs for a Code En
//  * @param {*} codeEn
//  */
// const findIdccsFromCodeEn = (codeEn) => {
//   const found = referentielCodesEnCodesIdcc.filter((x) => x.Codelaformation === codeEn && x.Statut === "CPNE");
//
//   if (found.length > 0) {
//     // Joining all idccs in one list without empty spaces
//     const allIdccs = found
//       .map((x) => x.CodeIDCC)
//       .join(",")
//       .replace(/\s/g, "")
//       .split(",");
//
//     return [...new Set(allIdccs)]; // return all uniques idccs
//   }
//
//   return [];
// };
//

//
// return {
//   findIdccsFromCodeEn: findIdccsFromCodeEn,
//   findOpcosFromIdccs: findOpcosFromIdccs,
//   findOpcosFromCodeEn: async (codeEn) => {
//     const codesIdcc = findIdccsFromCodeEn(codeEn);
//     return uniqBy(findOpcosFromIdccs(codesIdcc), "Opérateurdecompétences");
//   },
// };
