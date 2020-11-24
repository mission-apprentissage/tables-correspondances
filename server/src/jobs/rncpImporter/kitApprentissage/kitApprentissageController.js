const createReferentielCodesDiplomesRncp = require("./referentielCodesDiplomesRncp");
const createReferentielRncp = require("./referentielRncp");
const createReferentielCertificateurs = require("./referentielCertificateurs");
const createReferentielNsf = require("./referentielNsf");
const createReferentielRome = require("./referentielRome");
const createReferentielBlocCompetences = require("./referentielBlocsCompetences");
const createReferentielVoixAcces = require("./referentielVoixAcces");
const path = require("path");

class KitApprentissageController {
  constructor() {
    const codeDiplomesFile = path.join(__dirname, "../assets", "codes_diplomes.v1.3.csv");
    this.referentielCodesDiplomesRncp = createReferentielCodesDiplomesRncp();
    this.referentielCodesDiplomesRncp.load(codeDiplomesFile);

    const infoFile = path.join(__dirname, "../assets", "rncp_info.v1.3.csv");
    this.referentielRNCP = createReferentielRncp();
    this.referentielRNCP.load(infoFile);

    const certificateursFile = path.join(__dirname, "../assets", "rncp_certificateurs.v1.3.csv");
    this.referentielCertificateursRncp = createReferentielCertificateurs();
    this.referentielCertificateursRncp.load(certificateursFile);

    const nsfFile = path.join(__dirname, "../assets", "rncp_nsf.v1.3.csv");
    this.referentielNsf = createReferentielNsf();
    this.referentielNsf.load(nsfFile);

    const romeFile = path.join(__dirname, "../assets", "rncp_rome.v1.3.csv");
    this.referentielRome = createReferentielRome();
    this.referentielRome.load(romeFile);

    const blocCompetencesFile = path.join(__dirname, "../assets", "rncp_blocs_competences.v1.3.csv");
    this.referentielBlocCompetences = createReferentielBlocCompetences();
    this.referentielBlocCompetences.load(blocCompetencesFile);

    const voixAccesFile = path.join(__dirname, "../assets", "rncp_voix_acces.v1.3.csv");
    this.referentielVoixAcces = createReferentielVoixAcces();
    this.referentielVoixAcces.load(voixAccesFile);
  }

  getDataFromRncp(providedRncp) {
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

    const cfdUpdated = this.findCfdFromRncp(rncp);
    const infoRncpUpdated = this.findInfoFromRncp(rncp);
    const infoRncpCertificateurs = this.findCertificateursFromRncp(rncp);
    const nsfUpdated = this.findNsfFromRncp(rncp);
    const romesUpdated = this.findRomesFromRncp(rncp);
    const blocUpdated = this.findBlocCompetencesFromRncp(rncp);
    const voixAccesUpdated = this.findVoixAccesFromRncp(rncp);

    return {
      code_rncp: rncp,
      intitule_diplome: infoRncpUpdated.value.intituleDiplome,
      date_fin_validite_enregistrement: infoRncpUpdated.value.date_fin_validite_enregistrement,
      active_inactive: infoRncpUpdated.value.ActiveInactive,
      etat_fiche_rncp: infoRncpUpdated.value.EtatFiche,
      niveau_europe: infoRncpUpdated.value.NiveauEurope,
      code_type_certif: infoRncpUpdated.value.CodeTypeCertif,
      type_certif: infoRncpUpdated.value.TypeCertif,
      ancienne_fiche: infoRncpUpdated.value.AncienneFiche,
      nouvelle_fiche: infoRncpUpdated.value.NouvelleFiche,
      type_enregistrement: infoRncpUpdated.value.TypeEnregistrement,
      certificateurs: infoRncpCertificateurs.value,
      nsf_code: nsfUpdated.value.code,
      nsf_libelle: nsfUpdated.value.Libelle,
      romes: romesUpdated.value,
      blocs_competences: blocUpdated.value,
      voix_acces: voixAccesUpdated.value,
      cfd: cfdUpdated.value,
    };
  }

  findCfdFromRncp(rncp_code) {
    const educ_nat_code = this.referentielCodesDiplomesRncp.findCodeEn(rncp_code);
    return { info: !educ_nat_code ? "Erreur:  Non trouvé" : "Ok", value: educ_nat_code };
  }

  findInfoFromRncp(rncp_code) {
    const info = this.referentielRNCP.findInfo(rncp_code);
    if (info.length === 0) {
      return {
        info: "Erreur: Non trouvé",
        value: {
          intituleDiplome: null,
          date_fin_validite_enregistrement: null,
          ActiveInactive: null,
          EtatFiche: null,
          NiveauEurope: null,
          CodeTypeCertif: null,
          TypeCertif: null,
          AncienneFiche: null,
          NouvelleFiche: null,
          TypeEnregistrement: null,
        },
      };
    }
    if (info.length > 1) {
      return {
        info: "Erreur: Code Rncp trouvé plusieurs fois",
        value: {
          intituleDiplome: null,
          date_fin_validite_enregistrement: null,
          ActiveInactive: null,
          EtatFiche: null,
          NiveauEurope: null,
          CodeTypeCertif: null,
          TypeCertif: null,
          AncienneFiche: null,
          NouvelleFiche: null,
          TypeEnregistrement: null,
        },
      };
    }
    return { info: "Ok", value: info[0] };
  }

  findNsfFromRncp(rncp_code) {
    const info = this.referentielNsf.findNsf(rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", value: { code: null, Libelle: null } };
    }
    if (info.length > 1) {
      return { info: "Erreur: Code Rncp trouvé plusieurs fois", value: { code: null, Libelle: null } };
    }
    return { info: "Ok", value: info[0] };
  }

  findRomesFromRncp(rncp_code) {
    let info = this.referentielRome.findRomes(rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", value: null };
    }
    info = info.map((m) => ({
      etat_fiche: m.EtatFiche,
      rome: m.Rome,
      libelle: m.libelle,
    }));

    return { info: "Ok", value: info };
  }

  findBlocCompetencesFromRncp(rncp_code) {
    let info = this.referentielBlocCompetences.findBlocsCompetences(rncp_code);
    if (info.length === 0) {
      return { info: "Erreur:  Non trouvé", value: null };
    }

    info = info.map((m) => ({
      numero_bloc: m.numero_bloc,
      intitule: m.intitule,
    }));

    return { info: "Ok", value: info };
  }

  findCertificateursFromRncp(rncp_code) {
    let info = this.referentielCertificateursRncp.findInfo(rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", value: [] };
    }
    if (info.length > 1) {
      info = info.map((m) => ({
        certificateur: m.Certificateur,
        siret_certificateur: m.siret_organisme,
      }));
      return { info: "Code Rncp trouvé plusieurs fois", value: info };
    }

    return {
      info: "Ok",
      value: [
        {
          certificateur: info[0].Certificateur,
          siret_certificateur: info[0].siret_organisme,
        },
      ],
    };
  }

  findVoixAccesFromRncp(rncp_code) {
    let info = this.referentielVoixAcces.findVoix(rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", value: [] };
    }

    if (info.length > 1) {
      info = info.map((m) => ({
        code_libelle: m.code_libelle,
        intitule: m.intitule,
      }));
      return { info: "Code Rncp trouvé plusieurs fois", value: info };
    }

    return {
      info: "Ok",
      value: [
        {
          code_libelle: info[0].code_libelle,
          intitule: info[0].intitule,
        },
      ],
    };
  }

  findRncpFromCfd(educ_nat_code) {
    const rncp_code = this.referentielCodesDiplomesRncp.findCodeRNCP(educ_nat_code);
    return { info: !rncp_code ? "Erreur: Non trouvé" : "Ok", value: rncp_code };
  }
}

const kitApprentissageController = new KitApprentissageController();
module.exports = kitApprentissageController;
