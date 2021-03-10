const { uniq, compact } = require("lodash");
const path = require("path");
const XLSX = require("xlsx");
const { readXLSXFile } = require("../../common/utils/fileUtils");
const { downloadAndSaveFileFromS3 } = require("../../common/utils/awsUtils");

const FILE_LOCAL_PATH = path.join(__dirname, "./assets", "KitApprentissage.latest.xlsx");
class KitApprentissageController {
  async init() {
    await downloadAndSaveFileFromS3("mna-services/features/rncp/KitApprentissage.latest.xlsx", FILE_LOCAL_PATH);

    const { sheet_name_list, workbook } = readXLSXFile(FILE_LOCAL_PATH);

    // Sheet 1 === CodeDiplome_RNCP{Version}
    const worksheetCodeDiplome = workbook.Sheets[sheet_name_list[1]];
    this.referentielCodesDiplomesRncp = XLSX.utils.sheet_to_json(worksheetCodeDiplome, { range: 0, raw: false });

    // Sheet 3 === RNCP{date}
    const worksheetInfoRNCP = workbook.Sheets[sheet_name_list[3]];
    this.referentielRncp = XLSX.utils.sheet_to_json(worksheetInfoRNCP, { range: 0, raw: false });

    // Sheet 4 === RNCPCertificateurs
    const worksheetRNCPCertificateurs = workbook.Sheets[sheet_name_list[4]];
    this.referentielCertificateursRncp = XLSX.utils.sheet_to_json(worksheetRNCPCertificateurs, {
      range: 0,
      raw: false,
    });

    // Sheet 5 === RNCPVoixAcces
    const worksheetRNCPVoixAcces = workbook.Sheets[sheet_name_list[5]];
    this.referentielVoixAcces = XLSX.utils.sheet_to_json(worksheetRNCPVoixAcces, { range: 0, raw: false });

    // Sheet 6 === RNCPRome
    const worksheetRNCPRome = workbook.Sheets[sheet_name_list[6]];
    this.referentielRome = XLSX.utils.sheet_to_json(worksheetRNCPRome, { range: 0, raw: false });

    // Sheet 7 === RNCPNsf
    const worksheetRNCPNsf = workbook.Sheets[sheet_name_list[7]];
    this.referentielNsf = XLSX.utils.sheet_to_json(worksheetRNCPNsf, { range: 0, raw: false });

    // Sheet 8 === RNCPBlocCompetences
    const worksheetRNCPBlocCompetences = workbook.Sheets[sheet_name_list[8]];
    this.referentielBlocCompetences = XLSX.utils.sheet_to_json(worksheetRNCPBlocCompetences, { range: 0, raw: false });

    // Sheet 9 === RNCPPartenaires
    const worksheetRNCPPartenaires = workbook.Sheets[sheet_name_list[9]];
    this.referentielPartenaires = XLSX.utils.sheet_to_json(worksheetRNCPPartenaires, { range: 0, raw: false });
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

    const cfdsUpdated = this.findCfdFromRncp(rncp);
    const infoRncpUpdated = this.findInfoFromRncp(rncp);
    const infoRncpCertificateurs = this.findCertificateursFromRncp(rncp);
    const nsfUpdated = this.findNsfFromRncp(rncp);
    const romesUpdated = this.findRomesFromRncp(rncp);
    const blocUpdated = this.findBlocCompetencesFromRncp(rncp);
    const voixAccesUpdated = this.findVoixAccesFromRncp(rncp);
    const partenairesUpdated = this.findPartenairesFromRncp(rncp);

    return {
      code_rncp: rncp,
      intitule_diplome: infoRncpUpdated.value.Intitule,
      date_fin_validite_enregistrement: infoRncpUpdated.value.Date_Fin_Enregistrement,
      active_inactive: infoRncpUpdated.value.Actif,
      etat_fiche_rncp: infoRncpUpdated.value.Etat_Fiche,
      niveau_europe: infoRncpUpdated.value.Nomenclature_Europe_Intitule,
      code_type_certif: infoRncpUpdated.value.Abrege_Code,
      type_certif: infoRncpUpdated.value.Abrege_Intitule,
      ancienne_fiche: infoRncpUpdated.value.Ancienne_Certification,
      nouvelle_fiche: infoRncpUpdated.value.Nouvelle_Certification,
      type_enregistrement: infoRncpUpdated.value.Type_Enregistrement,
      certificateurs: infoRncpCertificateurs.value,
      nsf_code: nsfUpdated.value.Nsf_Code,
      nsf_libelle: nsfUpdated.value.Nsf_Intitule,
      romes: romesUpdated.value,
      blocs_competences: blocUpdated.value,
      voix_acces: voixAccesUpdated.value,
      si_jury_ca: voixAccesUpdated.si_jury_ca,
      partenaires: partenairesUpdated.value,
      cfds: cfdsUpdated.value,
    };
  }

  findCfdFromRncp(rncp_code) {
    let found = this.referentielCodesDiplomesRncp.filter((x) => x["Code RNCP"] === rncp_code);
    const cfds = found.length > 0 ? found.map((f) => f["Code Diplome"]) : [];

    return { info: cfds.length === 0 ? "Erreur:  Non trouvé" : "Ok", value: cfds };
  }

  findInfoFromRncp(rncp_code) {
    const info = this.referentielRncp.filter((x) => x.Numero_Fiche === rncp_code);
    if (info.length === 0) {
      return {
        info: "Erreur: Non trouvé",
        value: {
          Intitule: null,
          Date_Fin_Enregistrement: null,
          Actif: null,
          Etat_Fiche: null,
          Nomenclature_Europe_Intitule: null,
          Abrege_Code: null,
          Abrege_Intitule: null,
          Ancienne_Certification: [],
          Nouvelle_Certification: [],
          Type_Enregistrement: null,
        },
      };
    }
    if (info.length > 1) {
      const mergedFiche = {
        ...info[0],
        Ancienne_Certification: [info[0].Ancienne_Certification],
        Nouvelle_Certification: [info[0].Nouvelle_Certification],
      };
      let issues = false;
      for (let ite = 1; ite < info.length; ite++) {
        const fiche = info[ite];
        if (
          mergedFiche.Intitule !== fiche.Intitule ||
          mergedFiche.Date_Fin_Enregistrement !== fiche.Date_Fin_Enregistrement ||
          mergedFiche.Actif !== fiche.Actif ||
          mergedFiche.Etat_Fiche !== fiche.Etat_Fiche ||
          mergedFiche.Nomenclature_Europe_Intitule !== fiche.Nomenclature_Europe_Intitule ||
          mergedFiche.Abrege_Code !== fiche.Abrege_Code ||
          mergedFiche.Abrege_Intitule !== fiche.Abrege_Intitule ||
          mergedFiche.Type_Enregistrement !== fiche.Type_Enregistrement
        ) {
          issues = true;
          break;
        } else {
          mergedFiche.Ancienne_Certification = compact(
            uniq([...mergedFiche.Ancienne_Certification, fiche.Ancienne_Certification])
          );
          mergedFiche.Nouvelle_Certification = compact(
            uniq([...mergedFiche.Nouvelle_Certification, fiche.Nouvelle_Certification])
          );
        }
      }
      if (issues) {
        return {
          info: "Erreur: Plusieurs fiche trouvées mais non cohérentes entre elles",
          value: {
            Intitule: null,
            Date_Fin_Enregistrement: null,
            Actif: null,
            Etat_Fiche: null,
            Nomenclature_Europe_Intitule: null,
            Abrege_Code: null,
            Abrege_Intitule: null,
            Ancienne_Certification: [],
            Nouvelle_Certification: [],
            Type_Enregistrement: null,
          },
        };
      }
      return {
        info: "ok",
        value: mergedFiche,
      };
    }
    return {
      info: "Ok",
      value: {
        ...info[0],
        Ancienne_Certification: compact([info[0].Ancienne_Certification]),
        Nouvelle_Certification: compact([info[0].Nouvelle_Certification]),
      },
    };
  }

  findNsfFromRncp(rncp_code) {
    const info = this.referentielNsf.filter((x) => x.Numero_Fiche === rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", value: { code: null, Libelle: null } };
    }
    if (info.length > 1) {
      return { info: "Erreur: Code Rncp trouvé plusieurs fois", value: { code: null, Libelle: null } };
    }
    return { info: "Ok", value: info[0] };
  }

  findRomesFromRncp(rncp_code) {
    let info = this.referentielRome.filter((x) => x.Numero_Fiche === rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", value: null };
    }
    info = info.map((m) => ({
      rome: m.Codes_Rome_Code,
      libelle: m.Codes_Rome_Libelle,
    }));

    return { info: "Ok", value: info };
  }

  findBlocCompetencesFromRncp(rncp_code) {
    let info = this.referentielBlocCompetences.filter((x) => x.Numero_Fiche === rncp_code);
    if (info.length === 0) {
      return { info: "Erreur:  Non trouvé", value: null };
    }

    info = info.map((m) => ({
      numero_bloc: m.Bloc_Competences_Code,
      intitule: m.Bloc_Competences_Libelle,
    }));

    return { info: "Ok", value: info };
  }

  findCertificateursFromRncp(rncp_code) {
    let info = this.referentielCertificateursRncp.filter((x) => x.Numero_Fiche === rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", value: [] };
    }
    if (info.length > 1) {
      info = info.map((m) => ({
        certificateur: m.Nom_Certificateur || "",
        siret_certificateur: m.Siret_Certificateur || "",
      }));
      return { info: "Code Rncp trouvé plusieurs fois", value: info };
    }

    return {
      info: "Ok",
      value: [
        {
          certificateur: info[0].Nom_Certificateur || "",
          siret_certificateur: info[0].Siret_Certificateur || "",
        },
      ],
    };
  }

  findVoixAccesFromRncp(rncp_code) {
    let info = this.referentielVoixAcces.filter((x) => x.Numero_Fiche === rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", si_jury_ca: false, value: [] };
    }

    let si_jury_ca = false;
    if (info.length > 1) {
      info = info.map((m) => {
        if (m.Si_Jury === "En contrat d’apprentissage") si_jury_ca = true;
        return {
          code_libelle: m.code_libelle,
          si_jury: m.Si_Jury,
        };
      });
      return { info: "Code Rncp trouvé plusieurs fois", si_jury_ca, value: info };
    }

    if (info[0].Si_Jury === "En contrat d’apprentissage") si_jury_ca = true;

    return {
      info: "Ok",
      si_jury_ca,
      value: [
        {
          code_libelle: info[0].code_libelle,
          si_jury: info[0].Si_Jury,
        },
      ],
    };
  }

  findRncpFromCfd(educ_nat_code) {
    const rncp_code = this.referentielCodesDiplomesRncp.find((x) => x["Code Diplome"] === educ_nat_code);
    return { info: !rncp_code ? "Erreur: Non trouvé" : "Ok", value: rncp_code };
  }

  findPartenairesFromRncp(rncp_code) {
    let info = this.referentielPartenaires.filter((x) => x.Numero_Fiche === rncp_code);
    if (info.length === 0) {
      return { info: "Erreur: Non trouvé", value: [] };
    }

    if (info.length > 1) {
      info = info.map((m) => ({
        Nom_Partenaire: m.Nom_Partenaire,
        Siret_Partenaire: m.Siret_Partenaire,
        Habilitation_Partenaire: m.Habilitation_Partenaire,
      }));
      return { info: "Code Rncp trouvé plusieurs fois", value: info };
    }

    return {
      info: "Ok",
      value: [
        {
          Nom_Partenaire: info[0].Nom_Partenaire,
          Siret_Partenaire: info[0].Siret_Partenaire,
          Habilitation_Partenaire: info[0].Habilitation_Partenaire,
        },
      ],
    };
  }
}

const kitApprentissageController = new KitApprentissageController();
module.exports = kitApprentissageController;
