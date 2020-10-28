const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const fileManager = require("./FileManager");
const { Etablissement } = require("../../common/model/index");

const commonUpdates = (etablissement, mapping) => {
  let updateInfo = { source_info_sifa: mapping.source_info_sifa };
  if (!etablissement.code_postal && mapping.code_postal) {
    updateInfo.code_postal = mapping.code_postal;
  }
  if (!etablissement.email_communication && mapping.email_communication) {
    updateInfo.email_communication = mapping.email_communication;
  }
  return updateInfo;
};

const hydrate = async () => {
  logger.info(`Import Sifa siret`);

  // Chargement export Sifa
  // https://docs.google.com/spreadsheets/d/103HkbVuNqYOY0q9UlJUC5Txym5yeVNtX/edit#gid=387955437

  const sifa = fileManager.getXLSXFile();

  let count = 0;
  try {
    await asyncForEach(sifa, async (e) => {
      const mapping = {
        uai: e.numero_uai,
        email_communication: e.mel_uai,
        libelle_educnationale: e.denomination_principale_uai,
        // libelle_communication: e.patronyme_uai,
        code_postal: e.code_postal_uai,
        localite: e.localite_acheminement_uai,
        telephone: e.numero_telephone_uai,
        siret: e.numero_siren_siret_uai,
        source_info_sifa: {
          source: "sifa",
          code_gestion: e.code_gestion,
          adresse: e.adresse_uai,
          mel: e.mel,
          enquete: e.enquete,
          nature_uai: e.nature_uai,
          specificite_uai: e.specificite_uai,
          nouveau: e.nouveau,
        },
      };

      const etablissements = await Etablissement.find({ $or: [{ uai: mapping.uai }, { siret: mapping.siret }] });
      let updateInfo = null;
      if (etablissements.length === 1) {
        const eta = etablissements[0];
        if (mapping.siret === eta.siret && mapping.uai === eta.uai) {
          updateInfo = commonUpdates(eta, mapping);
        } else if (mapping.siret === eta.siret) {
          updateInfo = commonUpdates(eta, mapping);
          // MUST BE VERIFIED BY HAND

          // to check
          // if (!eta.uai && mapping.uai) {
          //   updateInfo.uai = mapping.uai;
          // }
        } else if (mapping.uai === eta.uai) {
          updateInfo = commonUpdates(eta, mapping);
          // MUST BE VERIFIED BY HAND

          // console.log("here");
          // console.log(mapping, eta);
          // if (eta.siret_gestionnaire !== mapping.siret && eta.siret_formateur !== mapping.siret) {
          //   // Verif mapping.siret API ENTREPRISE SI MEME ADRESSE ALORS REMPLACER eta.SIRET par mapping.siret
          // }
        }
      } else if (etablissements.length > 1) {
        //await asyncForEach(etablissements, async (ea) => {});
        // for (let ite = 0; ite < etablissements.length; ite++) {
        //   const eta = etablissements[ite];
        // }
      } else {
        // New etablissement
        count++;
        //   const newEtablissement = new Etablissement(mapping);
        //   await newEtablissement.save();
        //   logger.debug(`L'établissement '${etablissement.siret}' a été ajouté dans l'annuaire`);
      }
    });
    logger.info(count);
    logger.info(`Import Sifa siret done`);
  } catch (error) {
    logger.error(`Import sifa siret failed`, error);
  }
};

// const updateGestionnaireInfo = async (etablissement) => {
//   const codeGestionnaire = etablissement.source_info.uainiveau1_codedger;
//   const gestionnaire = await Etablissement.findOne({ "source_info.uai_codedger": codeGestionnaire });
//   if (gestionnaire) {
//     const gestionnaireInfo = {
//       id_gestionnaire: gestionnaire._id.toString(),
//       uai_gestionnaire: gestionnaire.uai,
//       siret_gestionnaire: gestionnaire.siret,
//     };

//     // Should always match gestionnaire.libelle_administratif === etablissement.libelle_administratif_gestionnaire
//     // if (gestionnaire.libelle_administratif !== etablissement.libelle_administratif_gestionnaire) {
//     //   logger.error("Does not match");
//     // }

//     return gestionnaireInfo;
//   } else {
//     logger.info(`Etablissement gestionnaire non trouvé`);
//     return null;
//   }
// };

// const updateFormateurInfo = async (etablissement) => {
//   const codeFormateur = etablissement.source_info.uainiveau2_codedger;
//   const formateur = await Etablissement.findOne({ "source_info.uai_codedger": codeFormateur });
//   if (formateur) {
//     const formateurInfo = {
//       id_formateur: formateur._id.toString(),
//       uai_formateur: formateur.uai,
//       siret_formateur: formateur.siret,
//     };

//     // Should always match formateur.libelle_administratif === etablissement.libelle_administratif_formateur
//     // if (formateur.libelle_administratif !== etablissement.libelle_administratif_formateur) {
//     //   logger.error("Does not match");
//     // }

//     return formateurInfo;
//   } else {
//     if (formateur && formateur.niveau_uai === 3) {
//       logger.info(`Etablissement formateur non trouvé mais le niveau de l'etablissement est de 3`);
//     }
//     return null;
//   }
// };

// const linker = async () => {
//   try {
//     logger.info(`Link etablissements`);
//     const etablissements = await Etablissement.find({});
//     await asyncForEach(etablissements, async (e) => {
//       const etablissement = e.toObject();
//       const gestionnaireInfo = await updateGestionnaireInfo(etablissement);
//       const formateurInfo = await updateFormateurInfo(etablissement);

//       if (gestionnaireInfo || formateurInfo) {
//         await Etablissement.findOneAndUpdate(
//           { _id: etablissement._id },
//           {
//             ...etablissement,
//             ...gestionnaireInfo,
//             ...formateurInfo,
//             last_update_at: Date.now(),
//           },
//           { new: true }
//         );
//       }
//     });

//     logger.info(`Link etablissements done`);
//   } catch (error) {
//     logger.error(`Link etablissements failed`, error);
//   }
// };

const importRef = async () => {
  await hydrate();
  //await linker();
};
module.exports = importRef;
