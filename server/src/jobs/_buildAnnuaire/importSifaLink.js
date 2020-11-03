const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const fileManager = require("./FileManager");
const { Etablissement } = require("../../common/model/index");
const { uniq } = require("lodash");

const hydrate = async () => {
  logger.info(`Import Sifa link`);

  // Chargement export Sifa link
  // https://docs.google.com/spreadsheets/d/17YuA5fTXHrJkJWC8rVEKcBgQvYoUCROq/edit#gid=54204954

  const sifaDoc = fileManager.getXLSXFile("./ListeCFA_sitesformation.xlsx", [
    "numero_uai_cfa",
    "denomination_principale_cfa",
    "patronyme_cfa",
    "departement_cfa	",
    "numero_uai_site",
    "denomination_principale_site",
    "patronyme_site",
    "departement_site",
  ]);

  const equalLines = [];
  const sifa = [];
  for (let ite = 0; ite < sifaDoc.length; ite++) {
    const e = sifaDoc[ite];
    if (e.numero_uai_site === e.numero_uai_cfa) {
      equalLines.push(e);
    } else {
      sifa.push(e);
    }
  }

  const uaiCFA = sifa.map((e) => e.numero_uai_cfa);
  const uaiSites = sifa.map((e) => e.numero_uai_site);

  const uaiSitesCouple = new Map();
  for (let ite = 0; ite < sifa.length; ite++) {
    const e = sifa[ite];
    const previous = uaiSitesCouple.get(e.numero_uai_site);
    if (previous) {
      uaiSitesCouple.set(e.numero_uai_site, uniq([...previous, e.numero_uai_cfa]));
    } else {
      uaiSitesCouple.set(e.numero_uai_site, [e.numero_uai_cfa]);
    }
  }
  const uais = uniq([...uaiCFA, ...uaiSites]);
  //console.log(uais.length);

  const etablissements = [];
  const restErrors = new Map();
  for (let ite = 0; ite < uais.length; ite++) {
    const uai = uais[ite];
    const isInCFA = uaiCFA.includes(uai); // Existe en tant que cfa
    const isInSite = uaiSites.includes(uai); // Existe en tant que site

    if (isInCFA && !isInSite) {
      // 438
      etablissements.push({
        uai,
        niveau: 1,
        uai_gestionnaire: uai,
        uai_formateur: null,
      });
    } else {
      // 3024
      const cfas = uaiSitesCouple.get(uai);
      if (cfas && cfas.length === 1) {
        // 2716
        const uaiParent = cfas[0];
        const isParentInCFA = uaiCFA.includes(uaiParent); // Parent Existe en tant que cfa
        const isParentInSite = uaiSites.includes(uaiParent); // Parent Existe en tant que site

        if (isParentInCFA && !isParentInSite) {
          // 2562
          etablissements.push({
            uai,
            niveau: 2,
            uai_gestionnaire: uaiParent,
            uai_formateur: null,
          });
        } else {
          // 154
          if (isParentInCFA && isParentInCFA) {
            // 154
            if (!isInCFA && isInSite) {
              // 149
              etablissements.push({
                uai,
                niveau: 3,
                uai_gestionnaire: null, // TO FIND AFTER
                uai_formateur: uaiParent,
              });
            } else {
              // 5
              // Ces établissements ont un gestionnaire de niveau 2
              etablissements.push({
                uai,
                niveau: 2,
                uai_gestionnaire: uaiParent,
                uai_formateur: null,
              });
            }
          }
        }
      } else if (cfas && cfas.length > 1) {
        // 308
        // Mutiple parent
        if (!isInCFA && isInSite) {
          // 305 // TO EXTRACT
        } else {
          // 3
        }

        restErrors.set(uai, cfas);
      }
    }
  }

  for (let ite = 0; ite < etablissements.length; ite++) {
    const etablissement = etablissements[ite];
    if (etablissement.niveau === 3) {
      const formateur = etablissements.find((e) => e.uai === etablissement.uai_formateur);
      if (formateur) {
        // 145
        if (formateur.niveau === 2) {
          // 145
          etablissement.uai_gestionnaire = formateur.uai_gestionnaire;
        }
      } else {
        // 4 // TO EXTRACT
      }
    }
  }

  try {
    // STEP 1 ADD UAI THAT DOES NOT EXIST
    // todo

    //STEP 2 Lookup in bdd des uais, CHECK VALIDITé, update if needed
    let cc = 0;
    console.log(etablissements.length);
    await asyncForEach(etablissements, async (e) => {
      //3154
      const mapping = {
        uai: e.uai,
        niveau_uai: e.niveau,
        uai_gestionnaire: e.uai_gestionnaire,
        uai_formateur: e.uai_formateur,
      };

      const annu = await Etablissement.find({ uai: mapping.uai });
      //let updateInfo = null;
      if (annu.length === 1) {
        //773
        // Verify overlap
        // console.log(mapping, annu[0]);
      } else if (annu.length > 1) {
        // 0 => Good
      } else {
        //2381
      }
    });
    console.log(cc);
    logger.info(`Import Sifa link done`);
  } catch (error) {
    logger.error(`Import sifa link failed`, error);
  }
};

const importRef = async () => {
  await hydrate();
};
module.exports = importRef;
