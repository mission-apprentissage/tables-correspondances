const logger = require("../../common/logger");
const parseFichesFile = require("./parseFichesFile");
const kitApprentissageController = require("./kitApprentissage/kitApprentissageController");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const merge = require("deepmerge");
const { diff } = require("deep-object-diff");
const { FicheRncp } = require("../../common/model/index");

const isEligibleApprentissage = (fiche) => {
  if (!fiche) {
    return false;
  }

  if (fiche.TYPE_ENREGISTREMENT === "Enregistrement de droit") {
    return true;
  }

  if (fiche.TYPE_ENREGISTREMENT === "Enregistrement sur demande" && fiche.SI_JURY_CA === "Oui") {
    return true;
  }

  return false;
};

const lookupDiffAndMerge = (fiches) => {
  const refsKitApprentissage = kitApprentissageController.referentielRNCP.get();
  const notFound = [];
  for (let ite = 0; ite < refsKitApprentissage.length; ite++) {
    const ref = refsKitApprentissage[ite];
    let here = false;
    for (let jte = 0; jte < fiches.length; jte++) {
      const fiche = fiches[jte];
      if (ref.CodeRNCP === fiche.NUMERO_FICHE) {
        here = true;
        break;
      }
    }
    if (!here && !ref.CodeRNCP.includes("RS")) {
      // eslint-disable-next-line no-unused-vars
      const { CodeRNCP, ...rest } = ref;
      notFound.push({ ...rest, NUMERO_FICHE: CodeRNCP });
    }
  }
  return [...fiches, ...notFound];
};

const loadXmlFile = async (ficheInputStream) => {
  let { fiches: refFiches } = await parseFichesFile(ficheInputStream);

  // Vérification si le kit est plus "à jour" que le xml
  const fiches = lookupDiffAndMerge(refFiches);

  const referentiel = fiches.map((f) => {
    const result = kitApprentissageController.getDataFromRncp(f.NUMERO_FICHE);

    let certificateurs = [];
    if (f.CERTIFICATEURS) {
      const xmlCertificateurs = f.CERTIFICATEURS.map((fc) => ({
        certificateur: fc.NOM_CERTIFICATEUR ? fc.NOM_CERTIFICATEUR.trim() : "",
        siret_certificateur: fc.SIRET_CERTIFICATEUR ? fc.SIRET_CERTIFICATEUR.trim() : "",
      }));

      const merged = merge(xmlCertificateurs, result.certificateurs);

      const certificateursMap = new Map();
      for (let ite = 0; ite < merged.length; ite++) {
        const m = merged[ite];
        const certificateur = certificateursMap.get(m.certificateur.trim());
        if (!certificateur) {
          certificateursMap.set(m.certificateur.trim(), m);
        } else {
          if (certificateur.siret_certificateur !== m.siret_certificateur) {
            const diffCert = diff(certificateur, m);
            const diffKeys = Object.keys(diffCert);
            if (diffKeys.length === 1) {
              if (diffKeys[0] === "siret_certificateur") {
                if (!certificateur.siret_certificateur) certificateursMap.set(m.certificateur.trim(), m);
              }
            }
          }
        }
      }
      certificateurs = Array.from(certificateursMap.values());
    }
    return {
      ...result,
      certificateurs,
      eligible_apprentissage: isEligibleApprentissage(f),
      type_enregistrement: result.type_enregistrement || f.TYPE_ENREGISTREMENT || null,
      partenaires: f.PARTENAIRES || [],
      si_jury_ca: f.SI_JURY_CA === "Oui",
    };
  });

  return referentiel;
};

module.exports = async (ficheInputStream) => {
  logger.info("Loading RNCP referentiel (Fiches + Code Diplômes)...");
  const fichesRncp = await loadXmlFile(ficheInputStream);

  logger.info("Add fiches...");

  try {
    await asyncForEach(fichesRncp, async (fiche) => {
      const exist = await FicheRncp.findOne({ code_rncp: fiche.code_rncp });
      if (exist) {
        await FicheRncp.findOneAndUpdate({ _id: exist._id }, { ...fiche, last_update_at: Date.now() }, { new: true });
        logger.info(`BCN Formation '${fiche.code_rncp}' successfully updated in db`);
      } else {
        logger.info(`BCN Formation '${fiche.code_rncp}' not found`);
        const ficheRncpToAdd = new FicheRncp(fiche);
        await ficheRncpToAdd.save();
        logger.info(`Fiche Rncp '${ficheRncpToAdd.id}' successfully added`);
      }
    });
    logger.info(`Importing BCN Formations table Succeed`);
  } catch (error) {
    logger.error(error);
    logger.error(`Importing BCN Formations table Failed`);
  }
};
