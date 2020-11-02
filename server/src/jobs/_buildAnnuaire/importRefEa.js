const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const fs = require("fs-extra");
const path = require("path");
const { Etablissement } = require("../../common/model/index");

const hydrate = async () => {
  logger.info(`Import RefEA`);

  // Chargement export RefEA
  // https://enseignement-agricole.opendatasoft.com/explore/dataset/liste-uai-avec-coordonnees/table/?dataChart=eyJxdWVyaWVzIjpbeyJjaGFydHMiOlt7InR5cGUiOiJsaW5lIiwiZnVuYyI6IkFWRyIsInlBeGlzIjoidWFpX2lkX2NkbiIsInNjaWVudGlmaWNEaXNwbGF5Ijp0cnVlLCJjb2xvciI6IiM2NmMyYTUifV0sInhBeGlzIjoiZGF0ZV9qZXVfZG9ubmVlcyIsIm1heHBvaW50cyI6IiIsInRpbWVzY2FsZSI6InllYXIiLCJzb3J0IjoiIiwiY29uZmlnIjp7ImRhdGFzZXQiOiJsaXN0ZS11YWktYXZlYy1jb29yZG9ubmVlcyIsIm9wdGlvbnMiOnt9fX1dLCJkaXNwbGF5TGVnZW5kIjp0cnVlLCJhbGlnbk1vbnRoIjp0cnVlLCJ0aW1lc2NhbGUiOiIifQ%3D%3D&location=10,48.94505,1.20712

  const RefEA = await fs.readJson(path.resolve(__dirname, "./liste-uai-avec-coordonnees.json")); // 27/10/2020
  let created = false;
  try {
    await asyncForEach(RefEA, async (ea) => {
      const etablissement = ea.fields;

      const mapping = {
        siret: etablissement.uai_code_siret,
        uai: etablissement.uai_code_educnationale,

        libelle_administratif_gestionnaire: etablissement.uainiveau1_libelle_administratif,
        libelle_administratif_formateur: etablissement.uainiveau2_libelle_administratif,

        // annee_scolaire TODO prendre une décision si le champ doit être ajouté ou pas

        forme_etablissement: etablissement.uai_type,
        nature_etablissement: etablissement.uai_nature,
        libelle_administratif: etablissement.uai_libelle_administratif,
        libelle_communication: etablissement.uai_libelle_communication,

        debut_validite: etablissement.uai_debut_validite,
        fin_validite: etablissement.uai_fin_validite,
        siteweb: etablissement.uai_siteweb,
        telephone: etablissement.uai_telephone,
        email_communication: etablissement.uai_mail,
        fax: etablissement.uai_fax,
        ministere: etablissement.uai_ministere_principal,
        secteur: etablissement.uai_secteur,
        prive_orgaffiliation: etablissement.uaiprive_orgaffiliation,
        prive_typecontrat: etablissement.uaiprive_typecontrat,

        libelle_educnationale: etablissement.uai_libelle_educnationale,
        eleve: etablissement.uai_eleve === "Oui",
        etudiant: etablissement.uai_etudiant === "Oui",
        adulte: etablissement.uai_adulte === "Oui",
        apprenti: etablissement.uai_apprenti === "Oui",
        code_insee_localite: etablissement.uai_code_commume,
        localite: etablissement.uai_commune,
        code_region: etablissement.uai_code_region,
        region: etablissement.uai_region,
        code_departement: etablissement.uai_code_departement,
        departement: etablissement.uai_departement,
        niveau_uai: etablissement.uai_niveau,
        geo_coordonnees: etablissement.insee_geo ? etablissement.insee_geo.join(",") : "",

        source_info_refa: {
          source: "RefEA",
          uai_id_cdn: etablissement.uai_id_cdn,
          uai_codedger: etablissement.uai_codedger,
          uainiveau1_codedger: etablissement.uainiveau1_codedger,
          uainiveau2_codedger: etablissement.uainiveau2_codedger,
          adressepostale_ligne1: etablissement.adressepostale_ligne1,
          adressepostale_ligne2: etablissement.adressepostale_ligne2,
          adressepostale_ligne3: etablissement.adressepostale_ligne3,
          adressepostale_ligne4: etablissement.adressepostale_ligne4,
          adressepostale_ligne5: etablissement.adressepostale_ligne5,
          adressepostale_ligne6: etablissement.adressepostale_ligne6,
          adressegeographique_ligne1: etablissement.adressegeographique_ligne1,
          adressegeographique_ligne2: etablissement.adressegeographique_ligne2,
          adressegeographique_ligne3: etablissement.adressegeographique_ligne3,
          adressegeographique_ligne4: etablissement.adressegeographique_ligne4,
          adressegeographique_ligne5: etablissement.adressegeographique_ligne5,
          adressegeographique_ligne6: etablissement.adressegeographique_ligne6,
          date_jeu_donnees: etablissement.date_jeu_donnees,
        },
      };

      const exist = await Etablissement.findOne({ "source_info_refa.uai_codedger": etablissement.uai_codedger });
      if (!exist) {
        created = true;
        const newEtablissement = new Etablissement(mapping);
        await newEtablissement.save();
        logger.debug(`L'établissement '${etablissement.uai_codedger}' a été ajouté dans l'annuaire`);
      }
    });

    logger.info(`Import RefEA done (New ${created})`);
  } catch (error) {
    logger.error(`Import RefEA failed`, error);
  }
};

const updateGestionnaireInfo = async (etablissement) => {
  const codeGestionnaire = etablissement.source_info_refa.uainiveau1_codedger;
  const gestionnaire = await Etablissement.findOne({ "source_info_refa.uai_codedger": codeGestionnaire });
  if (gestionnaire) {
    const gestionnaireInfo = {
      id_gestionnaire: gestionnaire._id.toString(),
      uai_gestionnaire: gestionnaire.uai,
      siret_gestionnaire: gestionnaire.siret,
    };

    // Should always match gestionnaire.libelle_administratif === etablissement.libelle_administratif_gestionnaire
    // if (gestionnaire.libelle_administratif !== etablissement.libelle_administratif_gestionnaire) {
    //   logger.error("Does not match");
    // }

    return gestionnaireInfo;
  } else {
    logger.info(`Etablissement gestionnaire non trouvé`);
    return null;
  }
};

const updateFormateurInfo = async (etablissement) => {
  const codeFormateur = etablissement.source_info_refa.uainiveau2_codedger;
  const formateur = await Etablissement.findOne({ "source_info_refa.uai_codedger": codeFormateur });
  if (formateur) {
    const formateurInfo = {
      id_formateur: formateur._id.toString(),
      uai_formateur: formateur.uai,
      siret_formateur: formateur.siret,
    };

    // Should always match formateur.libelle_administratif === etablissement.libelle_administratif_formateur
    // if (formateur.libelle_administratif !== etablissement.libelle_administratif_formateur) {
    //   logger.error("Does not match");
    // }

    return formateurInfo;
  } else {
    if (formateur && formateur.niveau_uai === 3) {
      logger.info(`Etablissement formateur non trouvé mais le niveau de l'etablissement est de 3`);
    }
    return null;
  }
};

const linker = async () => {
  try {
    logger.info(`Link etablissements`);
    const etablissements = await Etablissement.find({ "source_info_refa.source": "RefEA" });
    await asyncForEach(etablissements, async (e) => {
      const etablissement = e.toObject();
      const gestionnaireInfo = await updateGestionnaireInfo(etablissement);
      const formateurInfo = await updateFormateurInfo(etablissement);

      if (gestionnaireInfo || formateurInfo) {
        await Etablissement.findOneAndUpdate(
          { _id: etablissement._id },
          {
            ...etablissement,
            ...gestionnaireInfo,
            ...formateurInfo,
            last_update_at: Date.now(),
          },
          { new: true }
        );
      }
    });

    logger.info(`Link etablissements done`);
  } catch (error) {
    logger.error(`Link etablissements failed`, error);
  }
};

const importRef = async () => {
  await hydrate();
  await linker();
};
module.exports = importRef;
