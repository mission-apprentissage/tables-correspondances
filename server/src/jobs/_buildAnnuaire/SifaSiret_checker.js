const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const fileManager = require("./FileManager");
const apiEntreprise = require("../../logic/common/apiEntreprise");

const hydrate = async () => {
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
    const results = [];
    await asyncForEach(sifa, async (e) => {
      const result = {
        ...e,
        sifa_siret_etat_administratif: "",
        correction_siret: "",
        siren: "",
        siret_siege: "",
        etat_administratif_siege: "",
        etablissements_secondaire: [],
      };
      if (e.numero_siren_siret_uai) {
        let addresse_sifa_siret = "";
        const adresses = new Map();
        const siren = e.numero_siren_siret_uai.substring(0, 9);
        result.siren = siren;
        const response = await apiEntreprise.getUnitesLegalesInfoFromSiren(siren);
        await new Promise((resolve) => setTimeout(resolve, 200)); // WAIT
        if (response) {
          const {
            unite_legale: { etablissement_siege, etablissements },
          } = response;
          result.siret_siege = etablissement_siege.siret;
          result.etat_administratif_siege = etablissement_siege.etat_administratif === "F" ? "Fermé" : "Actif";
          if (e.numero_siren_siret_uai === result.siret_siege) {
            result.sifa_siret_etat_administratif = result.etat_administratif_siege;
            addresse_sifa_siret = etablissement_siege.geo_adresse;
          }
          adresses.set(result.siret_siege, etablissement_siege.geo_adresse);
          const etablissements_secondaire = [];
          for (let ite = 0; ite < etablissements.length; ite++) {
            const etablissement = etablissements[ite];
            const current = {
              siret: etablissement.siret,
              etat_administratif: etablissement.etat_administratif === "F" ? "Fermé" : "Actif",
            };
            if (e.numero_siren_siret_uai === current.siret) {
              result.sifa_siret_etat_administratif = current.etat_administratif;
              addresse_sifa_siret = etablissement.geo_adresse;
            }
            adresses.set(etablissement.siret, etablissement.geo_adresse);
            etablissements_secondaire.push(current);
          }
          result.etablissements_secondaire = JSON.stringify(etablissements_secondaire); // Stringify?

          if (result.sifa_siret_etat_administratif === "Fermé") {
            adresses.forEach((val, key) => {
              if (val === addresse_sifa_siret && key !== result.sifa_siret_etat_administratif) {
                result.correction_siret += ` ${key}`;
              }
            });
          }
        } else {
          result.siren = "Invalide non trouvé api entreprise";
        }
      }

      results.push(result);
    });

    return results;
  } catch (error) {
    logger.error(`Check sifa failed`, error);
  }
};

const checker = async () => {
  const results = await hydrate();
  return results;
};
module.exports = checker;
