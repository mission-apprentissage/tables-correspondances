const logger = require("../../common/logger");
const kitApprentissageController = require("./kitApprentissageController");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { FicheRncp } = require("../../common/model/index");
const { getFileFromS3 } = require("../../common/utils/awsUtils");
const parseFichesFile = require("./parseFichesFile");

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

const lookupDiffAndMerge = (fichesXML, fichesKitA) => {
  const referentiel = [];
  for (let ite = 0; ite < fichesXML.length; ite++) {
    const ficheXML = fichesXML[ite];
    let elementToPush = null;
    for (let jte = 0; jte < fichesKitA.length; jte++) {
      const ficheKitA = fichesKitA[jte];
      if (ficheXML.code_rncp === ficheKitA.code_rncp) {
        elementToPush = {
          ...ficheKitA,
          code_type_certif: ficheXML.code_type_certif,
          partenaires: ficheXML.partenaires,
          certificateurs: ficheXML.certificateurs,
        };
        break;
      }
    }
    if (!elementToPush) {
      elementToPush = {
        ...ficheXML,
        eligible_apprentissage: isEligibleApprentissage(ficheXML),
      };
    }
    referentiel.push(elementToPush);
  }

  return referentiel;
};

const getFichesRncp = async () => {
  const fichesXMLInputStream = getFileFromS3("mna-services/features/rncp/export_fiches_RNCP_V2_0_latest.xml");
  logger.info("Parsing Fiches XML");
  let { fiches: fichesXML } = await parseFichesFile(fichesXMLInputStream);

  const fichesKitA = kitApprentissageController.referentielRncp.map((f) => {
    const result = kitApprentissageController.getDataFromRncp(f.Numero_Fiche);
    return {
      ...result,
      eligible_apprentissage: isEligibleApprentissage(result),
    };
  });

  // Vérification si le kit est plus "à jour" que le xml
  const referentiel = lookupDiffAndMerge(fichesXML, fichesKitA);

  return referentiel;
};

module.exports = async (localPath = null) => {
  logger.info("Loading Kit Apprentissage FC - RNCP referentiel...");
  await kitApprentissageController.init(localPath);
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
