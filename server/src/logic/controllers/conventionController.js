const { ConventionFile } = require("../../common/model/index");

const infosCodes = {
  infoDATAGOUV: {
    NotFound: 0,
    Found: 1,
  },
};
class ConventionController {
  constructor() {}

  async getConventionData(providedSiret, providedUai, providedSiretSiegeSocial) {
    const data = this.validateFormat(providedSiret, providedUai, providedSiretSiegeSocial);
    if (data.messages.error) return data;

    const { siret } = data.result;

    const info_datagouv_ofs = await this.findInfoDataGouv(siret);

    return {
      info_datagouv_ofs: info_datagouv_ofs.value,
      info_qualiopi_info: info_datagouv_ofs.qualiopi ? "OUI" : "NON",
      info_datagouv_ofs_info: info_datagouv_ofs.info,
      nda: info_datagouv_ofs.data?.numerodeclarationactivite || null,
      catalogue_published: info_datagouv_ofs.qualiopi,
    };
  }

  validateFormat(providedSiret, providedUai, providedSiretSiegeSocial) {
    const errors = [];
    if (!providedSiret || !/^[0-9]{14}$/g.test(providedSiret.trim())) {
      errors.push("Le Siret doit être définit et au format 14 caractères");
    }

    let siret = `${providedSiret}`.trim();

    if (!providedSiretSiegeSocial || !/^[0-9]{14}$/g.test(providedSiretSiegeSocial.trim())) {
      errors.push("Le Siret siége doit être définit et au format 14 caractères");
    }

    let siretSiegeSocial = `${providedSiretSiegeSocial}`.trim();

    // if(providedUai !=== "")
    // if (!providedUai || !/^[0-9A-Z]{8}$/g.test(providedUai.trim())) {
    //   errors.push("L'Uai doit être définit et au format 8 caractères");
    // }

    let uai = `${providedUai}`.trim();

    if (errors.length > 0) {
      return {
        result: {
          siret: providedSiret,
          uai: providedUai,
          siretSiegeSocial: providedSiretSiegeSocial,
        },
        messages: {
          error: errors.join(","),
        },
      };
    }

    return {
      result: {
        siret,
        uai,
        siretSiegeSocial,
      },
      messages: {
        siret: "Ok",
        uai: "Ok",
      },
    };
  }

  async findInfoDataGouv(siret) {
    const siren = siret.substring(0, 9);

    // find by siret, then by siren if not found
    let result = await ConventionFile.findOne({ type: "DATAGOUV", siretetablissementdeclarant: siret }).lean();

    if (result) {
      return {
        info: "Ok",
        value: infosCodes.infoDATAGOUV.Found,
        data: result,
        qualiopi:
          result.numerodeclarationactivite && result.certifications_actionsdeformationparapprentissage === "true",
      };
    }

    result = await ConventionFile.findOne({ type: "DATAGOUV", siren }).lean();
    if (!result) {
      return {
        info: "Erreur: DataGouv Non trouvé",
        value: infosCodes.infoDATAGOUV.NotFound,
        qualiopi: false,
        data: null,
      };
    }
    return {
      info: "Ok",
      value: infosCodes.infoDATAGOUV.Found,
      data: result,
      qualiopi: result.numerodeclarationactivite && result.certifications_actionsdeformationparapprentissage === "true",
    };
  }
}

const conventionController = new ConventionController();
module.exports = conventionController;
