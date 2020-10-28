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
        const eta = etablissements[0].toObject();
        if (mapping.siret === eta.siret && mapping.uai === eta.uai) {
          updateInfo = commonUpdates(eta, mapping);
        } else if (mapping.siret === eta.siret) {
          updateInfo = commonUpdates(eta, mapping);
          // MUST BE VERIFIED BY HAND
          count++;
        } else if (mapping.uai === eta.uai) {
          updateInfo = commonUpdates(eta, mapping);
          // MUST BE VERIFIED BY HAND
          count++;
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
        // MUST BE VERIFIED BY HAND
        count++;
      } else {
        if (mapping.siret !== "" || mapping.uai !== "") {
          // New etablissement
          const newEtablissement = new Etablissement(mapping);
          await newEtablissement.save();
          logger.debug(`L'établissement '${newEtablissement.siret}' a été ajouté dans l'annuaire`);
        }
      }
    });
    logger.info(count);
    logger.info(`Import Sifa siret done`);
  } catch (error) {
    logger.error(`Import sifa siret failed`, error);
  }
};

const importRef = async () => {
  await hydrate();
};
module.exports = importRef;
