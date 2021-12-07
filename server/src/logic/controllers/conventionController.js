const { ConventionFile } = require("../../common/model/index");

const infosCodes = {
  infoDEPP: {
    MissingUai: -1,
    NotFound: 0,
    Found: 1,
  },
  infoDGEFP: {
    NotFound: 0,
    SirenMatch: 1,
    SiretMatch: 2,
    SiretSiegeSocialMatch: 3,
  },
  infoDATAGOUV: {
    NotFound: 0,
    Found: 1,
  },
};

const computeCodes = {
  type: {
    ToCheck: "À vérifier",
    OF: "OF",
    CFA: "CFA",
  },
  conventionne: {
    No: "NON",
    Yes: "OUI",
  },
  declarePrefecture: {
    No: "NON",
    Yes: "OUI",
  },
};

class ConventionController {
  constructor() {}

  async getConventionData(providedSiret, providedUai, providedSiretSiegeSocial) {
    const data = this.validateFormat(providedSiret, providedUai, providedSiretSiegeSocial);
    if (data.messages.error) return data;

    const { siret, uai, siretSiegeSocial } = data.result;

    const info_depp = await this.findInfoDepp(uai);
    const info_dgefp = await this.findInfoDgefp(siret, siretSiegeSocial);
    const info_datagouv_ofs = await this.findInfoDataGouv(siret);

    const conventionnementInfos = this.conventionnement({
      info_depp: info_depp.value,
      info_dgefp: info_dgefp.value,
      info_datagouv_ofs: info_datagouv_ofs.value,
      info_qualiopi: info_datagouv_ofs.qualiopi ? "OUI" : "NON",
    });

    return {
      info_depp: info_depp.value,
      info_dgefp: info_dgefp.value,
      info_datagouv_ofs: info_datagouv_ofs.value,
      info_depp_info: info_depp.info,
      info_dgefp_info: info_dgefp.info,
      info_qualiopi_info: info_datagouv_ofs.qualiopi ? "OUI" : "NON",
      info_datagouv_ofs_info: info_datagouv_ofs.info,
      nda: info_datagouv_ofs.data?.numerodeclarationactivite || null,
      ...conventionnementInfos,
    };
  }

  conventionnement(filesInfos) {
    const result = {
      computed_type: computeCodes.type.ToCheck,
      computed_conventionne: computeCodes.conventionne.No,
      computed_declare_prefecture: computeCodes.declarePrefecture.No,
      catalogue_published: filesInfos.info_qualiopi === "OUI",
    };

    // Check In DEPP
    if (filesInfos.info_depp === infosCodes.infoDEPP.Found) {
      // Case in DEPP -> CFA + Conventionne
      result.computed_type = computeCodes.type.CFA;
      result.computed_conventionne = computeCodes.conventionne.Yes;
    }

    // Check DGEFP Siret / Siren
    if (
      filesInfos.info_dgefp === infosCodes.infoDGEFP.SirenMatch ||
      filesInfos.info_dgefp === infosCodes.infoDGEFP.SiretMatch ||
      filesInfos.info_dgefp === infosCodes.infoDGEFP.SiretSiegeSocialMatch ||
      filesInfos.info_datagouv_ofs === infosCodes.infoDATAGOUV.Found
    ) {
      // Case in DGEFP or DataGouv -> CFA + Declare Prefecture
      result.computed_type = computeCodes.type.CFA;
      result.computed_declare_prefecture = computeCodes.declarePrefecture.Yes;
    } else {
      result.computed_declare_prefecture = computeCodes.declarePrefecture.No;

      if (result.computed_type !== computeCodes.type.CFA) {
        result.computed_type = computeCodes.type.OF;
      }
    }

    return result;
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

  async findInfoDepp(uai) {
    const result = await ConventionFile.findOne({ type: "DEPP", numero_uai: uai });
    if (!result) {
      return { info: "Erreur: Depp Non trouvé", value: infosCodes.infoDEPP.NotFound };
    }
    return { info: "Ok", value: infosCodes.infoDEPP.Found };
  }

  async findInfoDgefp(siret, siretSiegeSocial) {
    const siren = siret.substring(0, 9);
    const numEtablissment = siret.substring(9, 14);
    const resultSiren = await ConventionFile.findOne({ type: "DGEFP", "N° SIREN": siren });
    if (!resultSiren) {
      const resultSiret = await ConventionFile.findOne({
        type: "DGEFP",
        "N° SIREN": siren,
        "N° Etablissement": numEtablissment,
      });

      if (!resultSiret) {
        const sirenSiege = siretSiegeSocial.substring(0, 9);
        const numEtablissmentSiege = siretSiegeSocial.substring(9, 14);
        const resultSiretSiege = await ConventionFile.findOne({
          type: "DGEFP",
          "N° SIREN": sirenSiege,
          "N° Etablissement": numEtablissmentSiege,
        });

        if (!resultSiretSiege) {
          return { info: "Erreur: Dgefp Non trouvé", value: infosCodes.infoDGEFP.NotFound };
        }

        return { info: "Ok siret siege", value: infosCodes.infoDGEFP.SiretSiegeSocialMatch };
      }
      return { info: "Ok siret", value: infosCodes.infoDGEFP.SiretMatch };
    }
    return { info: "Ok siren", value: infosCodes.infoDGEFP.SirenMatch };
  }

  async findInfoDataGouv(siret) {
    const siren = siret.substring(0, 9);
    const result = await ConventionFile.findOne({ type: "DATAGOUV", siren }).lean();
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
