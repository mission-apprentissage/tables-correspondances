const logger = require("../../common/logger");
const kitApprentissageController = require("./kitApprentissageController");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { FicheRncp } = require("../../common/model/index");

const isEligibleApprentissage = (fiche) => {
  if (!fiche) {
    return false;
  }

  if (fiche.type_enregistrement === "Enregistrement de droit") {
    return true;
  }

  if (fiche.type_enregistrement === "Enregistrement sur demande" && fiche.si_jury_ca) {
    return true;
  }

  return false;
};

const getFichesRncp = async () => {
  const fiches = kitApprentissageController.referentielRncp;

  const referentiel = fiches.map((f) => {
    const result = kitApprentissageController.getDataFromRncp(f.Numero_Fiche);
    return {
      ...result,
      eligible_apprentissage: isEligibleApprentissage(result),
    };
  });

  return referentiel;
};

module.exports = async () => {
  logger.info("Loading Kit Apprentissage FC - RNCP referentiel...");
  await kitApprentissageController.init();
  const fichesRncp = await getFichesRncp();
  logger.info("Add fiches to db...");

  try {
    await asyncForEach(fichesRncp, async (fiche) => {
      try {
        const exist = await FicheRncp.findOne({ code_rncp: fiche.code_rncp });
        if (exist) {
          await FicheRncp.findOneAndUpdate({ _id: exist._id }, { ...fiche, last_update_at: Date.now() }, { new: true });
          logger.info(`RNCP fiche '${fiche.code_rncp}' successfully updated in db`);
        } else {
          logger.info(`RNCP fiche '${fiche.code_rncp}' not found`);
          const ficheRncpToAdd = new FicheRncp(fiche);
          await ficheRncpToAdd.save();
          logger.info(`Fiche Rncp '${ficheRncpToAdd.id}' successfully added`);
        }
      } catch (error) {
        console.log(error);
      }
    });
    logger.info(`Importing RNCP fiches into db Succeed`);
  } catch (error) {
    logger.error(error);
    logger.error(`Importing RNCP fiches into db Failed`);
  }
};
