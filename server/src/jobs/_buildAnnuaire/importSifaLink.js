const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const fileManager = require("./FileManager");
const { Etablissement } = require("../../common/model/index");
const { uniq } = require("lodash");

const compare = (etablissement, data, messageParam = "") => {
  let message = messageParam;

  return {
    uaiRefEA: etablissement.uai,
    siretRefEA: etablissement.siret,
    uaiGestionnaireRefEA: etablissement.uai_gestionnaire,
    siretGestionnaireRefEA: etablissement.siret_gestionnaire,
    uaiFormateurRefEA: etablissement.uai_formateur,
    siretFormateurRefEA: etablissement.siret_formateur,
    niveau_uai: etablissement.niveau_uai,

    uaiSifa: data.uai,
    uaiNiveauSifa: data.niveau_uai,
    uaiGestionnaireSifa: data.uai_gestionnaire,
    uaiFormateurSifa: data.uai_formateur,

    message,
    id: etablissement._id,
  };
};

const linker = async () => {
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
                uai_gestionnaire: null,
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
          // 305 // TO EXTRACT ------------------------------------
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
        // 4 // TO EXTRACT ------------------------------------
      }
    }
  }

  try {
    // STEP 1 ADD UAI THAT DOES NOT EXIST
    // todo

    //STEP 2 Lookup in bdd des uais, CHECK VALIDITé, update if needed
    //let cc = 0;
    //onsole.log(etablissements.length);
    const toCheckManually = [];
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
        const current = annu[0].toObject();
        //const gestionnaire = await Etablissement.find({ uai: mapping.uai_gestionnaire });
        //const formateur = await Etablissement.find({ uai: mapping.uai_formateur });

        //773
        // Verify overlap

        if (current.niveau_uai !== mapping.niveau_uai) {
          // 539
          if (current.niveau_uai === 0) {
            // 407
            // const result = compare(current, mapping);
            // console.log(result);
            if (
              current.uai === mapping.uai &&
              current.uai_gestionnaire === mapping.uai_gestionnaire &&
              current.uai_formateur === mapping.uai_formateur
            ) {
              // Nothing todo
              // 0
            } else if (
              current.uai === mapping.uai &&
              current.uai_gestionnaire === mapping.uai_gestionnaire &&
              !current.uai_formateur &&
              !mapping.uai_formateur
            ) {
              // Nothing todo
              // 0
            } else if (
              current.uai === mapping.uai &&
              current.uai_gestionnaire === mapping.uai_gestionnaire &&
              current.uai_formateur !== mapping.uai_formateur &&
              mapping.uai_formateur
            ) {
              // 1 ------------------------------------
            } else if (
              current.uai === mapping.uai &&
              current.uai_gestionnaire !== mapping.uai_gestionnaire &&
              current.uai_formateur === mapping.uai_formateur &&
              mapping.uai_formateur
            ) {
              // 0
            } else if (
              current.uai === mapping.uai &&
              current.uai_gestionnaire !== mapping.uai_gestionnaire &&
              current.uai_formateur === mapping.uai_formateur &&
              mapping.uai_gestionnaire &&
              !mapping.uai_formateur
            ) {
              // 404
              const result = compare(
                current,
                mapping,
                `L'uai gestionnaire est probablement ${mapping.uai_gestionnaire}, le niveau uai est probablement ${mapping.niveau_uai}`
              );
              toCheckManually.push(result);
            } else if (
              current.uai === mapping.uai &&
              current.uai_gestionnaire !== mapping.uai_gestionnaire &&
              current.uai_formateur !== mapping.uai_formateur &&
              !current.uai_gestionnaire &&
              !current.uai_formateur
            ) {
              // 2 ------------------------------------
            }
          } else {
            // 132 ------------------------------------
          }
        } else {
          if (
            current.uai === mapping.uai &&
            current.uai_gestionnaire === mapping.uai_gestionnaire &&
            current.uai_formateur === mapping.uai_formateur
          ) {
            // Nothing todo
            // 5
          } else if (
            current.uai === mapping.uai &&
            current.uai_gestionnaire === mapping.uai_gestionnaire &&
            !current.uai_formateur &&
            !mapping.uai_formateur
          ) {
            // Nothing todo
            // 0
          } else if (
            current.uai === mapping.uai &&
            current.uai_gestionnaire === mapping.uai_gestionnaire &&
            current.uai_formateur !== mapping.uai_formateur &&
            mapping.uai_formateur
          ) {
            // 2
            // Compare
            const result = compare(current, mapping, `L'uai formateur est probablement ${mapping.uai_formateur}`);
            toCheckManually.push(result);
          } else if (
            current.uai === mapping.uai &&
            current.uai_gestionnaire !== mapping.uai_gestionnaire &&
            current.uai_formateur === mapping.uai_formateur &&
            mapping.uai_formateur
          ) {
            // Aucun cas
          } else if (
            current.uai === mapping.uai &&
            current.uai_gestionnaire !== mapping.uai_gestionnaire &&
            current.uai_formateur === mapping.uai_formateur &&
            mapping.uai_gestionnaire &&
            !mapping.uai_formateur
          ) {
            // 213
            // Compare
            const result = compare(current, mapping, `L'uai gestionnaire est probablement ${mapping.uai_gestionnaire}`);
            toCheckManually.push(result);
          } else if (
            current.uai === mapping.uai &&
            current.uai_gestionnaire !== mapping.uai_gestionnaire &&
            current.uai_formateur === mapping.uai_formateur &&
            !mapping.uai_gestionnaire &&
            !mapping.uai_formateur
          ) {
            // Aucun cas
          } else if (
            current.uai === mapping.uai &&
            current.uai_gestionnaire !== mapping.uai_gestionnaire &&
            current.uai_formateur !== mapping.uai_formateur &&
            !current.uai_gestionnaire &&
            !current.uai_formateur
          ) {
            const result = compare(
              current,
              mapping,
              `L'uai gestionnaire est probablement ${mapping.uai_gestionnaire}, L'uai formateur est probablement ${mapping.uai_formateur}`
            );
            toCheckManually.push(result);
          } else {
            // 0
          }
        }
      } else if (annu.length > 1) {
        // 0 => Good
      } else {
        //2381   ------------------------------------
      }
    });
    //console.log(cc);
    logger.info(toCheckManually.length);
    logger.info(`Import Sifa link done`);
    return toCheckManually;
  } catch (error) {
    logger.error(`Import sifa link failed`, error);
  }
};

const importRef = async () => {
  const toCheckManually = await linker();
  return toCheckManually;
};
module.exports = importRef;
