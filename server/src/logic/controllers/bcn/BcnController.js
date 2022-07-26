// #region Imports

const { infosCodes, niveaux, mappingNiveauCodeEn, computeCodes } = require("./Constants");
const { find, uniq } = require("lodash");
const moment = require("moment");
const logger = require("../../../common/logger");
const {
  BcnFormationDiplome,
  BcnLettreSpecialite,
  BcnNNiveauFormationDiplome,
  BcnNMef,
} = require("../../../common/model/index");

// #endregion

class BcnController {
  constructor() {
    const yearLimit = new Date().getFullYear();
    this.validLimiteDate = moment(`31/08/${yearLimit}`, "DD/MM/YYYY");
  }

  async getDataFromCfd(providedCfd) {
    if (!providedCfd || !/^[0-9A-Z]{8}[A-Z]?$/g.test(providedCfd.trim())) {
      return {
        result: {},
        messages: {
          error: "Le code formation diplôme doit être définit et au format 8 caractères ou 9 avec la lettre spécialité",
        },
      };
    }

    let cfd = providedCfd.length === 9 ? providedCfd.substring(0, 8) : providedCfd;
    cfd = `${cfd}`.trim();

    const specialiteUpdated =
      providedCfd.length === 9
        ? await this.getSpeciality(providedCfd.substring(8, 9))
        : { info: infosCodes.specialite.NotProvided, value: null };

    const cfdUpdated = await this.findCfd_bcn(cfd);
    const infoCfd = `${computeCodes.cfd[cfdUpdated.info]} dans la BCN`;
    const cfd_outdated = cfdUpdated.info === infosCodes.cfd.OutDated;

    if (cfdUpdated.value === null) {
      return {
        result: {
          cfd: cfd,
          cfd_outdated,
          date_fermeture: cfdUpdated.date_fermeture,
          date_ouverture: cfdUpdated.date_ouverture,
          specialite: null,
          niveau: null,
          intitule_long: null,
          intitule_court: null,
          diplome: null,
        },
        messages: {
          error: infoCfd,
          cfd: infoCfd,
          specialite: "Erreur",
          niveau: "Erreur",
          intitule_long: "Erreur",
          intitule_court: "Erreur",
          diplome: "Erreur",
        },
      };
    }

    const niveauUpdated = this.findNiveau(cfdUpdated.value);

    const {
      info: cfdDataInfo,
      value: { intitule_court, intitule_long, libelle_court, niveau_formation_diplome },
    } = await this.findCfdData(cfdUpdated.value);

    const diplomeUpdated = await this.findDiplome(cfdUpdated.value);

    return {
      result: {
        cfd: cfdUpdated.value,
        cfd_outdated,
        date_fermeture: cfdUpdated.date_fermeture,
        date_ouverture: cfdUpdated.date_ouverture,
        specialite: specialiteUpdated.value,
        niveau: niveauUpdated.value,
        intitule_long,
        intitule_court,
        diplome: diplomeUpdated.value,
        libelle_court,
        niveau_formation_diplome,
      },
      messages: {
        cfd: infoCfd,
        specialite: computeCodes.specialite[specialiteUpdated.info],
        niveau: computeCodes.niveau[niveauUpdated.info],
        intitule_long: computeCodes.intitule[cfdDataInfo],
        intitule_court: computeCodes.intitule[cfdDataInfo],
        diplome: computeCodes.diplome[diplomeUpdated.info],

        libelle_court: computeCodes.intitule[cfdDataInfo],
        niveau_formation_diplome: computeCodes.intitule[cfdDataInfo],
      },
    };
  }

  async getDataFromMef1011(providedMef) {
    if (!providedMef || !/^[0-9]{10,11}$/g.test(providedMef.trim())) {
      return {
        result: {},
        messages: {
          error: "Le code MEF doit être définit et au format 10 ou 11 caractères",
        },
      };
    }
    let mef = `${providedMef}`.trim();

    if (/^[0-9]{10}$/g.test(mef)) {
      return await this.getDataFromMef10(mef);
    } else {
      return await this.getDataFromMef11(mef);
    }
  }

  async getDataFromMef10(providedMef10) {
    if (!providedMef10 || !/^[0-9]{10}$/g.test(providedMef10.trim())) {
      return {
        result: {},
        messages: {
          error: "Le code MEF 10 doit être définit et au format 10 caractères",
        },
      };
    }
    let mef10 = `${providedMef10}`.trim();
    const cfdUpdated = await this.findCfdFromMef10(mef10);

    const modalite = this.getModalities(mef10);

    return {
      result: {
        mef10,
        modalite,
        cfd: cfdUpdated.value,
      },
      messages: {
        mef10: computeCodes.mef[cfdUpdated.info],
        cfdUpdated: computeCodes.cfd[cfdUpdated.info],
      },
    };
  }

  async getDataFromMef11(providedMef11) {
    if (!providedMef11 || !/^[0-9]{11}$/g.test(providedMef11.trim())) {
      return {
        result: {},
        messages: {
          error: "Le code MEF 11 doit être définit et au format 11 caractères",
        },
      };
    }
    let mef11 = `${providedMef11}`.trim();
    const cfdUpdated = await this.findCfdFromMef11(mef11);

    //const modalite = this.getModalities(mef10);

    return {
      result: {
        mef11,
        //modalite,
        cfd: cfdUpdated.value,
      },
      messages: {
        mef11: computeCodes.mef[cfdUpdated.info],
        cfdUpdated: computeCodes.cfd[cfdUpdated.info],
      },
    };
  }

  async getMefsFromCfd(cfd) {
    const mefs10List = await this.findMefsFromCfd(cfd);

    const mefs10 = mefs10List.value.map((mef10) => ({
      mef10,
      modalite: this.getModalities(mef10),
    }));

    const mefsAproximation = { info: "", value: [] };
    if (mefs10.length === 0) {
      const mefs11List = await this.findMefs11(cfd);
      for (let i = 0; i < mefs11List.value.length; i++) {
        const mef11 = mefs11List.value[i];
        const mefTmp = await this.findMefFromMef11(mef11);
        const modalite = this.getModalities(mefTmp.value);
        const cfd = await this.findCfdFromMef10(mefTmp.value);
        const niveau = this.findNiveau(cfd.value);

        const {
          value: { intitule_long, libelle_court, niveau_formation_diplome },
        } = await this.findCfdData(cfd.value);

        const match = find(mefsAproximation.value, { cfd: cfd.value });
        if (!match) {
          mefsAproximation.value.push({
            mef10: mefTmp.value,
            modalite,
            cfd: cfd.value,
            intitule_long,
            libelle_court,
            niveau_formation_diplome,
            niveau: niveau.value,
          });
        }
      }
      mefsAproximation.info = "Codes Mef trouvés les plus proches du code CFD fournit";
    }

    const mefs8 = await this.findMefs8(cfd);

    const mefs11 = await this.findMefs11FromCfd(cfd);

    return {
      result: {
        mefs10,
        mefs8: mefs8.value,
        mefs_aproximation: mefsAproximation.value,
        mefs11: mefs11.value,
      },
      messages: {
        mefs10: computeCodes.mef[mefs10List.info],
        mefs8: computeCodes.mef[mefs8.info],
        mefs_aproximation: mefsAproximation.info,
        mefs11: computeCodes.mef[mefs11.info],
      },
    };
  }

  async getUniqMefFromMefs(mefs) {
    let mef10Data = { result: {}, messages: {} };
    if (mefs.result.mefs10.length === 1) {
      mef10Data = await this.getDataFromMef10(mefs.result.mefs10[0].mef10);
      delete mef10Data.result.cfd;
    }
    return mef10Data;
  }

  async findCfd_bcn(codeEducNat, previousInfo = null) {
    try {
      const match = await BcnFormationDiplome.findOne(
        { FORMATION_DIPLOME: codeEducNat },
        {
          DATE_OUVERTURE: 1,
          DATE_FERMETURE: 1,
          NOUVEAU_DIPLOME_1: 1,
          NOUVEAU_DIPLOME_2: 1,
          NOUVEAU_DIPLOME_3: 1,
          NOUVEAU_DIPLOME_4: 1,
          NOUVEAU_DIPLOME_5: 1,
          NOUVEAU_DIPLOME_6: 1,
          NOUVEAU_DIPLOME_7: 1,
        }
      ).lean();
      if (!match) {
        return { info: infosCodes.cfd.NotFound, value: null, date_fermeture: null, date_ouverture: null };
      }

      const date_ouverture = moment(match.DATE_OUVERTURE, "DD/MM/YYYY").valueOf();

      if (match.DATE_FERMETURE === "") {
        // Valide codeEn
        return {
          info: previousInfo ? previousInfo : infosCodes.cfd.Found,
          value: codeEducNat,
          date_fermeture: null,
          date_ouverture,
        };
      }

      const closingDate = moment(match.DATE_FERMETURE, "DD/MM/YYYY");

      if (closingDate.isAfter(this.validLimiteDate)) {
        // Valide codeEn
        return {
          info: previousInfo ? previousInfo : infosCodes.cfd.Found,
          value: codeEducNat,
          date_fermeture: closingDate.valueOf(),
          date_ouverture,
        };
      }

      if (match.NOUVEAU_DIPLOME_7 !== "" && match.NOUVEAU_DIPLOME_7 !== null) {
        return await this.findCfd_bcn(match.NOUVEAU_DIPLOME_7, infosCodes.cfd.Updated);
      }
      if (match.NOUVEAU_DIPLOME_6 !== "" && match.NOUVEAU_DIPLOME_6 !== null) {
        return await this.findCfd_bcn(match.NOUVEAU_DIPLOME_6, infosCodes.cfd.Updated);
      }
      if (match.NOUVEAU_DIPLOME_5 !== "" && match.NOUVEAU_DIPLOME_5 !== null) {
        return await this.findCfd_bcn(match.NOUVEAU_DIPLOME_5, infosCodes.cfd.Updated);
      }
      if (match.NOUVEAU_DIPLOME_4 !== "" && match.NOUVEAU_DIPLOME_4 !== null) {
        return await this.findCfd_bcn(match.NOUVEAU_DIPLOME_4, infosCodes.cfd.Updated);
      }
      if (match.NOUVEAU_DIPLOME_3 !== "" && match.NOUVEAU_DIPLOME_3 !== null) {
        return await this.findCfd_bcn(match.NOUVEAU_DIPLOME_3, infosCodes.cfd.Updated);
      }
      if (match.NOUVEAU_DIPLOME_2 !== "" && match.NOUVEAU_DIPLOME_2 !== null) {
        return await this.findCfd_bcn(match.NOUVEAU_DIPLOME_2, infosCodes.cfd.Updated);
      }
      if (match.NOUVEAU_DIPLOME_1 !== "" && match.NOUVEAU_DIPLOME_1 !== null) {
        return await this.findCfd_bcn(match.NOUVEAU_DIPLOME_1, infosCodes.cfd.Updated);
      }

      return {
        info: infosCodes.cfd.OutDated,
        value: codeEducNat,
        date_fermeture: closingDate.valueOf(),
        date_ouverture,
      };
    } catch (err) {
      logger.error(err);
      return { info: infosCodes.cfd.NotFound, value: null, date_fermeture: null, date_ouverture: null };
    }
  }

  findNiveau(codeEducNat) {
    let code = codeEducNat.startsWith("010") ? codeEducNat.substring(0, 4) : codeEducNat.substring(0, 1);
    let foundNiveau = mappingNiveauCodeEn[codeEducNat] ?? mappingNiveauCodeEn[code];

    if (foundNiveau) {
      const toText = niveaux[parseInt(foundNiveau) - 3];
      return { info: infosCodes.niveau.NothingDoTo, value: toText };
    } else {
      return { info: infosCodes.niveau.Error, value: null };
    }
  }

  async findCfdData(codeEducNat) {
    const match = await BcnFormationDiplome.findOne(
      { FORMATION_DIPLOME: codeEducNat },
      { LIBELLE_LONG_200: 1, LIBELLE_STAT_33: 1, NIVEAU_FORMATION_DIPLOME: 1, LIBELLE_COURT: 1 }
    ).lean();

    if (!match) {
      return {
        info: infosCodes.intitule.Error,
        value: {
          intitule_long: null,
          intitule_court: null,
          niveau_formation_diplome: null,
          libelle_court: null,
        },
      };
    }

    return {
      info: infosCodes.intitule.NothingDoTo,
      value: {
        intitule_long: match.LIBELLE_LONG_200,
        intitule_court: match.LIBELLE_STAT_33,
        niveau_formation_diplome: match.NIVEAU_FORMATION_DIPLOME,
        libelle_court: match.LIBELLE_COURT,
      },
    };
  }

  async findDiplome(codeEducNat) {
    const tronc = codeEducNat.substring(0, 3);
    const match = await BcnNNiveauFormationDiplome.findOne(
      { NIVEAU_FORMATION_DIPLOME: tronc },
      { LIBELLE_100: 1 }
    ).lean();
    if (!match) {
      return { info: infosCodes.diplome.Error, value: null };
    }

    return { info: infosCodes.diplome.NothingDoTo, value: match.LIBELLE_100 };
  }

  async findCfdFromMef10(mef10) {
    const cfds = await BcnNMef.distinct("FORMATION_DIPLOME", { MEF: mef10 });
    if (!cfds.length) {
      return { info: infosCodes.mef.NotFound, value: null };
    }

    if (cfds.length > 1) {
      return { info: infosCodes.mef.Multiple, value: null };
    }
    return { info: infosCodes.mef.NothingDoTo, value: cfds[0] };
  }

  async findMefsFromCfd(codeEducNat) {
    const mefs = await BcnNMef.distinct("MEF", { FORMATION_DIPLOME: codeEducNat });
    if (!mefs.length) {
      return { info: infosCodes.mef.NotFound, value: [] };
    }
    return { info: infosCodes.mef.NothingDoTo, value: mefs };
  }

  async findCfdFromMef11(mef11) {
    const match = await BcnNMef.findOne({ MEF_STAT_11: mef11 });
    if (!match) {
      return { info: infosCodes.mef.NotFound, value: null };
    }

    return { info: infosCodes.mef.NothingDoTo, value: `${match.FORMATION_DIPLOME}` };
  }

  async findMefFromMef11(mef11) {
    const match = await BcnNMef.findOne({ MEF_STAT_11: mef11 }, { MEF: 1 }).lean();
    if (!match) {
      return { info: infosCodes.mef.NotFound, value: null };
    }
    return { info: infosCodes.mef.NothingDoTo, value: match.MEF };
  }

  async findMefs11(codeEducNat) {
    const tronc = codeEducNat.substring(3, 8);
    const mefs11 = await BcnNMef.distinct("MEF_STAT_11", { MEF_STAT_11: { $regex: `${tronc}$` } });
    if (!mefs11.length) {
      return { info: infosCodes.mef.NotFound, value: [] };
    }
    return { info: infosCodes.mef.NothingDoTo, value: mefs11 };
  }

  async findMefs11FromCfd(cfd) {
    const mefs11 = await BcnNMef.distinct("MEF_STAT_11", { FORMATION_DIPLOME: cfd });
    if (!mefs11.length) {
      return { info: infosCodes.mef.NotFound, value: [] };
    }
    return { info: infosCodes.mef.NothingDoTo, value: mefs11 };
  }

  async findMefs8(codeEducNat) {
    const match = await BcnNMef.find({ FORMATION_DIPLOME: codeEducNat }, { DISPOSITIF_FORMATION: 1 }).lean();
    if (!match.length) {
      return { info: infosCodes.mef.NotFound, value: [] };
    }
    const result = match.map((m) => `${m.DISPOSITIF_FORMATION}${codeEducNat.substring(3, codeEducNat.length)}`);
    return {
      info: infosCodes.mef.NothingDoTo,
      value: uniq(result),
    };
  }

  getModalities(mef_10_code) {
    return {
      duree: mef_10_code !== "" ? mef_10_code.substring(8, 9) : "",
      annee: mef_10_code !== "" ? mef_10_code.substring(9, 10) : "",
    };
  }

  async getSpeciality(specialityLetter) {
    try {
      const specialityData = await BcnLettreSpecialite.findOne(
        { LETTRE_SPECIALITE: specialityLetter },
        { LIBELLE_LONG: 1, LIBELLE_COURT: 1 }
      ).lean();
      return {
        info: infosCodes.specialite.NothingDoTo,
        value: {
          lettre: specialityLetter,
          libelle: specialityData ? specialityData.LIBELLE_LONG : null,
          libelle_court: specialityData ? specialityData.LIBELLE_COURT : null,
        },
      };
    } catch (err) {
      logger.error(err);
      return { info: infosCodes.specialite.Error, value: null };
    }
  }
}

const bcnController = new BcnController();
module.exports = bcnController;
