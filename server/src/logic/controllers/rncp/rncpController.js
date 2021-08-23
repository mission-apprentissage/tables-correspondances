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

    if (!fiche) {
      return {
        result: {},
        messages: {
          code_rncp: "Erreur: Non trouvé",
        },
      };
    }

    return {
      result: {
        ...fiche._doc,
      },
      messages: {
        code_rncp: "Ok",
      },
    };
  }

  async findRncpFromCfd(cfd) {
    const result = await FicheRncp.findOne({ cfds: { $in: [cfd] } });
    if (!result) {
      return { info: "Erreur: Non trouvé", value: null };
    }
    return { info: !result.code_rncp ? "Erreur: Non trouvé" : "Ok", value: result.code_rncp };
  }
}

const rncpController = new RncpController();
module.exports = rncpController;
