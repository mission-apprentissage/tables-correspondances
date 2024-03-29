const apiEntreprise = require("../../common/apis/apiEntreprise");
const conventionController = require("./conventionController");
const geoController = require("../controllers/geo/geoController");

class EntrepriseApiData {
  constructor() {}

  async findDataFromSiret(providedSiret) {
    if (!providedSiret || !/^[0-9]{14}$/g.test(providedSiret.trim())) {
      return {
        result: {},
        messages: {
          error: "Le Siret doit être définit et au format 14 caractères",
        },
      };
    }

    let siret = `${providedSiret}`.trim();

    const siren = siret.substring(0, 9);
    let entrepriseApiInfo;
    let entrepriseData;
    try {
      entrepriseData = await apiEntreprise.getEntreprise(siren);
      entrepriseApiInfo = entrepriseData.entreprise;
    } catch (e) {
      console.error(e);
      return {
        result: {},
        messages: {
          error: "Siren non trouvé",
        },
      };
    }

    let etablissementApiInfo;
    try {
      if (entrepriseData.etablissement_siege.siret === siret) {
        etablissementApiInfo = entrepriseData.etablissement_siege;
      } else {
        etablissementApiInfo = await apiEntreprise.getEtablissement(siret);
      }
    } catch (e) {
      console.error(e);
      return {
        result: {},
        messages: {
          error: "Siret non trouvé",
        },
      };
    }

    const info_datagouv_ofs = await conventionController.findInfoDataGouv(siret);

    let code_dept = etablissementApiInfo.adresse.code_insee_localite.substring(0, 2);
    code_dept = code_dept === "97" ? etablissementApiInfo.adresse.code_insee_localite.substring(0, 3) : code_dept;
    const { nom_dept, nom_region, code_region, nom_academie, num_academie } = geoController.findDataByDepartementNum(
      code_dept
    );

    return {
      result: {
        siege_social: etablissementApiInfo.siege_social,
        etablissement_siege_siret: entrepriseApiInfo.siret_siege_social,
        siret: etablissementApiInfo.siret,
        siren,
        naf_code: etablissementApiInfo.naf,
        naf_libelle: etablissementApiInfo.libelle_naf,
        tranche_effectif_salarie: etablissementApiInfo.tranche_effectif_salarie_etablissement,
        date_creation: new Date(etablissementApiInfo.date_creation_etablissement * 1000),
        date_mise_a_jour: new Date(etablissementApiInfo.date_mise_a_jour * 1000),
        diffusable_commercialement: etablissementApiInfo.diffusable_commercialement,
        enseigne: etablissementApiInfo.enseigne ? etablissementApiInfo.enseigne : entrepriseApiInfo.enseigne,

        adresse: this.buildAdresse(etablissementApiInfo.adresse),
        numero_voie: etablissementApiInfo.adresse.numero_voie,
        type_voie: etablissementApiInfo.adresse.type_voie,
        nom_voie: etablissementApiInfo.adresse.nom_voie,
        complement_adresse: etablissementApiInfo.adresse.complement_adresse,
        code_postal: etablissementApiInfo.adresse.code_postal,
        num_departement: code_dept,
        nom_departement: nom_dept,
        nom_academie: nom_academie,
        num_academie: num_academie,
        localite: etablissementApiInfo.adresse.localite,
        code_insee_localite: etablissementApiInfo.adresse.code_insee_localite,
        cedex: etablissementApiInfo.adresse.cedex,

        date_fermeture: new Date(etablissementApiInfo.etat_administratif.date_fermeture * 1000),
        ferme: etablissementApiInfo.etat_administratif.value !== "A",

        region_implantation_code: etablissementApiInfo.region_implantation.code,
        region_implantation_nom: etablissementApiInfo.region_implantation.value,
        region: nom_region,
        num_region: code_region,
        commune_implantation_code: etablissementApiInfo.commune_implantation.code,
        commune_implantation_nom: etablissementApiInfo.commune_implantation.value,
        pays_implantation_code: etablissementApiInfo.pays_implantation.code,
        pays_implantation_nom: etablissementApiInfo.pays_implantation.value,

        entreprise_siren: entrepriseApiInfo.siren,
        entreprise_procedure_collective: entrepriseApiInfo.procedure_collective,
        entreprise_enseigne: entrepriseApiInfo.enseigne,
        entreprise_numero_tva_intracommunautaire: entrepriseApiInfo.numero_tva_intracommunautaire,
        entreprise_code_effectif_entreprise: entrepriseApiInfo.code_effectif_entreprise,
        entreprise_forme_juridique_code: entrepriseApiInfo.forme_juridique_code,
        entreprise_forme_juridique: entrepriseApiInfo.forme_juridique,
        entreprise_raison_sociale: entrepriseApiInfo.raison_sociale,
        entreprise_nom_commercial: entrepriseApiInfo.nom_commercial,
        entreprise_capital_social: entrepriseApiInfo.capital_social,
        entreprise_date_creation: new Date(entrepriseApiInfo.date_creation * 1000),
        entreprise_date_radiation: entrepriseApiInfo.date_radiation,
        entreprise_naf_code: entrepriseApiInfo.naf_entreprise,
        entreprise_naf_libelle: entrepriseApiInfo.libelle_naf_entreprise,
        entreprise_date_fermeture: entrepriseApiInfo.etat_administratif.date_cessation,
        entreprise_ferme: entrepriseApiInfo.etat_administratif.value === "C",
        entreprise_siret_siege_social: entrepriseApiInfo.siret_siege_social,
        entreprise_nom: entrepriseApiInfo.nom,
        entreprise_prenom: entrepriseApiInfo.prenom,
        entreprise_categorie: entrepriseApiInfo.categorie_entreprise,
        entreprise_tranche_effectif_salarie: entrepriseApiInfo.tranche_effectif_salarie_entreprise,

        certifie_qualite: info_datagouv_ofs.qualiopi,
        api_entreprise_reference: true,
      },
      messages: {
        api_entreprise: "Ok",
      },
    };
  }

  buildAdresse(adresse) {
    const l1 = adresse.l1 && adresse.l1 !== "" ? `${adresse.l1}\r\n` : "";
    const l2 = adresse.l2 && adresse.l2 !== "" ? `${adresse.l2}\r\n` : "";
    const l3 = adresse.l3 && adresse.l3 !== "" ? `${adresse.l3}\r\n` : "";
    const l4 = adresse.l4 && adresse.l4 !== "" ? `${adresse.l4}\r\n` : "";
    const l5 = adresse.l5 && adresse.l5 !== "" ? `${adresse.l5}\r\n` : "";
    const l6 = adresse.l6 && adresse.l6 !== "" ? `${adresse.l6}\r\n` : "";
    const l7 = adresse.l7 && adresse.l7 !== "" ? `${adresse.l7}` : "";
    return `${l1}${l2}${l3}${l4}${l5}${l6}${l7}`;
  }
}

const entrepriseApiData = new EntrepriseApiData();
module.exports = entrepriseApiData;
