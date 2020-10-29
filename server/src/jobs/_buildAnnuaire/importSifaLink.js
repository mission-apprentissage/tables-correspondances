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
  console.log(uais.length);

  const etablissements = [];
  //const testEtablissementsLevel1 = [];
  //const testEtablissementsLevel2 = [];
  const restErrors = new Map();
  let cc = 0;
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
      //testEtablissementsLevel1.push(uai);
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
          //testEtablissementsLevel2.push(uai);
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
              //testEtablissementsLevel2.push(uai);
            }
          }
        }
      } else if (cfas && cfas.length > 1) {
        // 308
        // Mutiple parent
        restErrors.set(uai, cfas);
      }
    }
  }

  // let count = 0;
  // let count2 = 0;
  // for (let ite = 0; ite < etablissementsPotentialLevel1.length; ite++) {
  //   const potential = etablissementsPotentialLevel1[ite];
  //   if (testEtablissementsLevel1.includes(potential.uai)) {
  //     count++;
  //   } else if (testEtablissementsLevel2.includes(potential.uai)) {
  //     count2++;
  //   }
  // }
  // console.log(count);
  // console.log(count2);

  for (let ite = 0; ite < etablissements.length; ite++) {
    const etablissement = etablissements[ite];
    if (etablissement.niveau === 3) {
      const formateur = etablissements.find((e) => e.uai === etablissement.uai_formateur);
      if (formateur) {
        // 969
        if (formateur.niveau === 2) {
          // 969
          etablissement.uai_gestionnaire = formateur.uai_gestionnaire;
        }
      } else {
        // 70
        //const test = restErrors.get(etablissement.uai_formateur);
        //console.log(test);
      }
    }
  }

  console.log(cc);

  try {
    // let unknownUaiCfa = [];
    // await asyncForEach(sifa, async (e) => {
    //   const mappingCFA = {
    //     uai: e.numero_uai_cfa,
    //     libelle_educnationale: e.denomination_principale_cfa,
    //     // libelle_communication: e.patronyme_cfa,
    //     code_departement: e.departement_cfa,
    //   };

    //   const etablissements = await Etablissement.find({ uai: mappingCFA.uai });
    //   if (etablissements.length > 1) {
    //     logger.error(`Found mutiple uai cfa`);
    //   } else if (etablissements.length === 1) {
    //     // Do nothing
    //   } else if (etablissements.length === 0) {
    //     unknownUaiCfa.push(mappingCFA.uai);
    //   }
    // });
    // unknownUaiCfa = uniq(unknownUaiCfa);
    // logger.info(unknownUaiCfa.length); // 272

    // let unknownUaiSite = [];
    // let knownUaiSite = [];
    // let knownUaiCfa_Site = 0;
    // await asyncForEach(sifa, async (e) => {
    //   const mappingCFA = {
    //     uai: e.numero_uai_cfa,
    //     libelle_educnationale: e.denomination_principale_cfa,
    //     // libelle_communication: e.patronyme_cfa,
    //     code_departement: e.departement_cfa,
    //   };
    //   const mappingSite = {
    //     uai: e.numero_uai_site,
    //     libelle_educnationale: e.denomination_principale_site,
    //     // libelle_communication: e.patronyme_site,
    //     code_departement: e.departement_site,
    //   };

    //   const etablissements = await Etablissement.find({ uai: mappingSite.uai });

    //   if (etablissements.length > 1) {
    //     logger.error(`Found mutiple uai site`);
    //   } else if (etablissements.length === 1) {
    //     // Do nothing
    //     knownUaiSite.push(mappingSite.uai);
    //     const etablissementsCFA = await Etablissement.findOne({ uai: mappingCFA.uai });
    //     if (etablissementsCFA) {
    //       knownUaiCfa_Site++;
    //     }
    //   } else if (etablissements.length === 0) {
    //     unknownUaiSite.push(mappingSite.uai);
    //   }
    // });
    // knownUaiSite = uniq(knownUaiSite);
    // unknownUaiSite = uniq(unknownUaiSite);
    // logger.info(knownUaiSite.length); // 1281
    // logger.info(knownUaiCfa_Site); // 1322
    // logger.info(unknownUaiSite.length); // 2748

    logger.info(`Import Sifa link done`);
  } catch (error) {
    logger.error(`Import sifa link failed`, error);
  }
};

const importRef = async () => {
  await hydrate();
};
module.exports = importRef;
