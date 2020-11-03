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

const compare = (etablissement, data) => {
  let message = "";
  if (etablissement.siret === data.siret && etablissement.uai !== data.uai) {
    if (!etablissement.uai) {
      message = `L'uai RefEA n'est pas défini. `;
      if (etablissement.uai_gestionnaire === data.uai) {
        // L'uai DATA est trouvé sur le gestionnaire
        message += `L'uai SIFA est trouvé pour le gestionnnaire`;
      } else if (etablissement.uai_formateur === data.uai) {
        // L'uai DATA est trouvé sur le formateur
        message += `L'uai SIFA est trouvé pour le formateur`;
      } else {
        // Proposition uai DATA comme UAI
        message += `L'uai possible pour cette établissement est l'uai sifa ${data.uai}`;
      }
    } else {
      // Les uais ne sont pas les même
      message = `L'uai RefEA n'est pas le même que celui SIFA. `;
      if (etablissement.uai_gestionnaire === data.uai) {
        // L'uai DATA est trouvé sur le gestionnaire
        message += `L'uai SIFA est trouvé pour le gestionnnaire`;
      } else if (etablissement.uai_formateur === data.uai) {
        // L'uai DATA est trouvé sur le formateur
        message += `L'uai SIFA est trouvé pour le formateur`;
      } else {
        //
        if (data.uai === "" && etablissement.uai !== "") {
          message += `L'uai possible pour cette établissement est l'uai RefEa ${etablissement.uai}`;
        }
      }
    }
  } else if (etablissement.siret !== data.siret && etablissement.uai === data.uai) {
    if (!etablissement.siret) {
      message = `Le siret RefEA n'est pas défini. `;
      if (etablissement.siret_gestionnaire === data.siret) {
        // Le siret DATA est trouvé sur le gestionnaire
        message += `Le siret SIFA est trouvé pour le gestionnaire`;
      } else if (etablissement.siret_formateur === data.siret) {
        // Le siret DATA est trouvé sur le formateur
        message += `Le siret SIFA est trouvé pour le formateur`;
      } else {
        // Proposition siret DATA comme siret
        message += `Le siret possible pour cette établissement est le siret sifa ${data.siret}`;
      }
    } else {
      // Ne sont pas les mêmes
      message = `Le siret RefEA n'est pas le même que celui SIFA. `;
      if (etablissement.siret_gestionnaire === data.siret) {
        // Le siret DATA est trouvé sur le gestionnaire
        message += `Le siret SIFA est trouvé pour le gestionnaire`;
      } else if (etablissement.siret_formateur === data.siret) {
        // Le siret DATA est trouvé sur le formateur
        message += `Le siret SIFA est trouvé pour le formateur`;
      } else {
        // Proposition siret DATA comme siret
        message += ``;
        if (data.siret === "" && etablissement.siret !== "") {
          message += `Le siret possible pour cette établissement est le siret RefEa ${etablissement.siret}`;
        }
      }
    }
  }

  return {
    uaiRefEA: etablissement.uai,
    siretRefEA: etablissement.siret,
    uaiGestionnaireRefEA: etablissement.uai_gestionnaire,
    siretGestionnaireRefEA: etablissement.siret_gestionnaire,
    uaiFormateurRefEA: etablissement.uai_formateur,
    siretFormateurRefEA: etablissement.siret_formateur,
    niveau_uai: etablissement.niveau_uai,
    uaiSifa: data.uai,
    siretSifa: data.siret,
    message,
    id: etablissement._id,
  };
};

const hydrate = async () => {
  logger.info(`Import Sifa siret`);

  // Chargement export Sifa
  // https://docs.google.com/spreadsheets/d/103HkbVuNqYOY0q9UlJUC5Txym5yeVNtX/edit#gid=387955437

  const sifa = fileManager.getXLSXFile("./ListeCFA_sifa_avecsiret.xlsx", [
    "code_gestion",
    "numero_uai",
    "mel",
    "denomination_principale_uai",
    "patronyme_uai",
    "adresse_uai",
    "code_postal_uai",
    "localite_acheminement_uai",
    "numero_telephone_uai",
    "mel_uai",
    "enquete",
    "nature_uai",
    "specificite_uai",
    "nouveau",
    "numero_siren_siret_uai",
  ]);

  try {
    const toCheckManually = [];
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
        const eta = etablissements[0].toObject();
        updateInfo = commonUpdates(eta, mapping);
        if (mapping.siret === eta.siret && mapping.uai === eta.uai) {
          // Nothing to do they are equal
        } else if (mapping.siret === eta.siret && mapping.siret !== "" && mapping.uai !== "") {
          // 4
          // Add to manual checking list
          const result = compare(eta, mapping);
          toCheckManually.push(result);
        } else if (mapping.uai === eta.uai && mapping.uai !== "" && mapping.siret !== "") {
          // 45
          // Add to manual checking list
          const result = compare(eta, mapping);
          toCheckManually.push(result);
        } else {
          // 76
          if (mapping.siret === "" && !eta.siret) {
            // 22
            // Nothing to do siret are empty
          } else {
            // 54
            // Add to manual checking list
            const result = compare(eta, mapping);
            toCheckManually.push(result);
          }
        }

        if (updateInfo) {
          await Etablissement.findOneAndUpdate(
            { _id: eta._id },
            {
              ...eta,
              ...updateInfo,
              last_update_at: Date.now(),
            },
            { new: true }
          );
        }
      } else if (etablissements.length > 1) {
        // 166
        const etablissement = await Etablissement.findOne({ uai: mapping.uai }, { siret: mapping.siret });
        if (etablissement) {
          // 163
          // Nothing to do they are equal
        } else {
          // 3
          // MUST BE VERIFIED BY HAND, Multiple found
          toCheckManually.push({
            uaiRefEA: "",
            siretRefEA: "",
            uaiGestionnaireRefEA: "",
            siretGestionnaireRefEA: "",
            uaiFormateurRefEA: "",
            siretFormateurRefEA: "",
            niveau_uai: "",
            uaiSifa: "",
            siretSifa: "",
            message: "",
            id: "",
          });
          for (let ite = 0; ite < etablissements.length; ite++) {
            const etablissement = etablissements[ite];
            toCheckManually.push({
              uaiRefEA: etablissement.uai,
              siretRefEA: etablissement.siret,
              uaiGestionnaireRefEA: etablissement.uai_gestionnaire,
              siretGestionnaireRefEA: etablissement.siret_gestionnaire,
              uaiFormateurRefEA: etablissement.uai_formateur,
              siretFormateurRefEA: etablissement.siret_formateur,
              niveau_uai: etablissement.niveau_uai,
              uaiSifa: mapping.uai,
              siretSifa: mapping.siret,
              message: "Multiple possibilité, aucune indication, à vérifier",
              id: etablissement._id,
            });
          }
          toCheckManually.push({
            uaiRefEA: "",
            siretRefEA: "",
            uaiGestionnaireRefEA: "",
            siretGestionnaireRefEA: "",
            uaiFormateurRefEA: "",
            siretFormateurRefEA: "",
            niveau_uai: "",
            uaiSifa: "",
            siretSifa: "",
            message: "",
            id: "",
          });
        }
      } else {
        // Add new etablissement
        const newEtablissement = new Etablissement(mapping);
        await newEtablissement.save();
      }
    });
    logger.info(toCheckManually.length); // 115 -> 133 -> 79
    logger.info(`Import Sifa siret done`);
    return toCheckManually;
  } catch (error) {
    logger.error(`Import sifa siret failed`, error);
  }
};

const importRef = async () => {
  const toCheckManually = await hydrate();
  return toCheckManually;
};
module.exports = importRef;
