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
  logger.info(`Import Sifa link`);

  // Chargement export Sifa link
  // https://docs.google.com/spreadsheets/d/17YuA5fTXHrJkJWC8rVEKcBgQvYoUCROq/edit#gid=54204954

  const sifa = fileManager.getXLSXFile("./ListeCFA_sitesformation.xlsx", [
    "numero_uai_cfa",
    "denomination_principale_cfa",
    "patronyme_cfa",
    "departement_cfa	",
    "numero_uai_site",
    "denomination_principale_site",
    "patronyme_site",
    "departement_site",
  ]);

  let count = 0;
  try {
    await asyncForEach(sifa, async (e) => {
      const mappingCFA = {
        uai: e.numero_uai_cfa,
        libelle_educnationale: e.denomination_principale_cfa,
        // libelle_communication: e.patronyme_cfa,
        code_departement: e.departement_cfa,
      };
      const mappingSite = {
        uai: e.numero_uai_site,
        libelle_educnationale: e.denomination_principale_site,
        // libelle_communication: e.patronyme_site,
        code_departement: e.departement_site,
      };

      const etablissements = await Etablissement.find({ uai: mappingCFA.uai });
      //console.log(etablissements.length);
      if (etablissements.length > 1) {
        console.log(etablissements);
      }
      //   const etablissements = await Etablissement.find({ $or: [{ uai: mapping.uai }, { siret: mapping.siret }] });
      //   let updateInfo = null;
      //   if (etablissements.length === 1) {
      //     const eta = etablissements[0].toObject();
      //     if (mapping.siret === eta.siret && mapping.uai === eta.uai) {
      //       updateInfo = commonUpdates(eta, mapping);
      //     } else if (mapping.siret === eta.siret) {
      //       updateInfo = commonUpdates(eta, mapping);
      //       // MUST BE VERIFIED BY HAND
      //       count++;
      //     } else if (mapping.uai === eta.uai) {
      //       updateInfo = commonUpdates(eta, mapping);
      //       // MUST BE VERIFIED BY HAND
      //       count++;
      //     }
      //     if (updateInfo) {
      //       await Etablissement.findOneAndUpdate(
      //         { _id: eta._id },
      //         {
      //           ...eta,
      //           ...updateInfo,
      //           last_update_at: Date.now(),
      //         },
      //         { new: true }
      //       );
      //     }
      //   } else if (etablissements.length > 1) {
      //     // MUST BE VERIFIED BY HAND
      //     count++;
      //   } else {
      //     if (mapping.siret !== "" || mapping.uai !== "") {
      //       // New etablissement
      //       const newEtablissement = new Etablissement(mapping);
      //       await newEtablissement.save();
      //       logger.debug(`L'établissement '${newEtablissement.siret}' a été ajouté dans l'annuaire`);
      //     }
      //   }
    });
    logger.info(count);
    logger.info(`Import Sifa link done`);
  } catch (error) {
    logger.error(`Import sifa link failed`, error);
  }
};

const importRef = async () => {
  await hydrate();
};
module.exports = importRef;
