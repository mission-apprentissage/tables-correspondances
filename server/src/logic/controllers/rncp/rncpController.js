const { FicheRncp } = require("../../../common/model/index");

class RncpController {
  constructor() {}

  async getDataFromRncp(providedRncp) {
    if (!providedRncp || !/^(RNCP)?[0-9]{2,5}$/g.test(providedRncp.trim())) {
      return {
        result: {
          code_rncp: providedRncp,
        },
        messages: {
          error: "Le code RNCP doit être définit et au format 5 ou 9 caractères,  RNCP24440 ou 24440",
        },
      };
    }

    let rncp = `${providedRncp}`.trim();
    if (rncp.length === 5) rncp = `RNCP${rncp}`;

    const fiche = await FicheRncp.findOne({ code_rncp: providedRncp });

    return {
      result: {
        ...fiche._doc,
      },
      messages: {
        code_rncp: "Ok",
      },
    };
  }

  async findRncpFromCfd(educ_nat_code) {
    const result = await FicheRncp.findOne({ cfd: educ_nat_code });
    if (!result) {
      return { info: !"Erreur: Non trouvé", value: null };
    }
    return { info: !result.code_rncp ? "Erreur: Non trouvé" : "Ok", value: result.code_rncp };
  }
}

const rncpController = new RncpController();
module.exports = rncpController;
