const { FicheRncp } = require("../../../common/model/index");
const moment = require("moment");

class RncpController {
  constructor() {
    const yearLimit = new Date().getFullYear();
    this.validLimiteDate = moment(`31/08/${yearLimit}`, "DD/MM/YYYY");
  }

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

    let code_rncp = `${providedRncp}`.trim();
    if (code_rncp.length === 5) code_rncp = `RNCP${code_rncp}`;

    const fiche = await FicheRncp.findOne({ code_rncp }).lean();

    if (!fiche) {
      return {
        result: {},
        messages: {
          code_rncp: "Erreur: Non trouvé",
        },
      };
    }

    const closingDate = fiche?.date_fin_validite_enregistrement
      ? moment(fiche.date_fin_validite_enregistrement, "DD/MM/YYYY")
      : null;

    return {
      result: {
        ...fiche,
        rncp_outdated: closingDate && closingDate.isBefore(this.validLimiteDate),
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
