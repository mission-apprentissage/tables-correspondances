const logger = require("../../common/logger");
const { getDataFromSiret } = require("../handlers/siretHandler");
const { getCoordinatesFromAddressData } = require("../handlers/geoHandler");
const conventionController = require("../controllers/conventionController");
const { findOnisepInfosEtablissementFromUAI } = require("../controllers/onisep/onisepController");
const { diffEtablissement } = require("../../common/utils/diffUtils");

const apiCfaDock = require("../../common/apis/apiCfaDock");

const parseErrors = (messages) => {
  if (!messages) {
    return "";
  }
  return Object.entries(messages)
    .filter(([key, value]) => key === "error" || `${value}`.toLowerCase().includes("erreur"))
    .reduce((acc, [key, value]) => `${acc}${acc ? " " : ""}${key}: ${value}.`, "");
};

const etablissementService = async (
  etablissement,
  { scope = { siret: true, geoloc: true, conventionnement: true, onisep: true } } = {}
) => {
  try {
    let error = null;

    let current = {
      code_postal: etablissement.code_postal,
      siret: etablissement.siret,
      etablissement_siege_siret: etablissement.etablissement_siege_siret,

      code_commune_insee: etablissement.code_commune_insee,
      commune: etablissement.localite,
      num_departement: etablissement.num_departement,
      nom_departement: etablissement.nom_departement,
      region: etablissement.region,
      num_region: etablissement.num_region,
      nom_academie: etablissement.nom_academie,
      num_academie: etablissement.num_academie,

      localite: etablissement.localite,
      numero_voie: etablissement.numero_voie,
      type_voie: etablissement.type_voie,
      nom_voie: etablissement.nom_voie,

      idcc: etablissement.idcc,
      opco_nom: etablissement.opco_nom,
      opco_siren: etablissement.opco_siren,

      geo_coordonnees: etablissement.geo_coordonnees,
    };

    let updatedEtablissement = {};

    // ENTREPRISE DATA
    if (scope.siret) {
      let withGeoloc = true;

      // don't retrieve geoloc if we already have it, since address never changes for a given siret
      if (current.geo_coordonnees) {
        withGeoloc = false;
        updatedEtablissement.geo_coordonnees = current.geo_coordonnees;
      }

      const { result: siretMapping, messages: siretMessages } = await getDataFromSiret(etablissement.siret, {
        withGeoloc,
      });

      let error = parseErrors(siretMessages);
      if (error) {
        return { updates: null, etablissement, error };
      }

      updatedEtablissement.code_commune_insee = siretMapping.commune_implantation_code;
      updatedEtablissement.commune = siretMapping.commune_implantation_nom;

      current.code_postal = siretMapping.code_postal;
      current.siret = siretMapping.siret;
      current.etablissement_siege_siret = siretMapping.etablissement_siege_siret;

      current.numero_voie = siretMapping.numero_voie;
      current.type_voie = siretMapping.type_voie;
      current.nom_voie = siretMapping.nom_voie;
      current.code_commune_insee = siretMapping.commune_implantation_code;
      current.commune = siretMapping.commune_implantation_nom;
      current.nom_academie = siretMapping.nom_academie;

      updatedEtablissement = {
        ...updatedEtablissement,
        ...siretMapping,
      };
    }

    // GEOLOC DATA
    if (scope.geoloc && !scope.siret) {
      // check scope.siret because geoloc is already retrieved by getDataFromSiret

      const { result: geoMapping, messages: geoMessages } = await getCoordinatesFromAddressData({
        numero_voie: current.numero_voie,
        type_voie: current.type_voie,
        nom_voie: current.nom_voie,
        localite: current.commune,
        code_postal: current.code_postal,
        code_insee: current.code_commune_insee,
      });
      error = parseErrors(geoMessages);
      if (error) {
        return { updates: null, etablissement, error };
      }

      updatedEtablissement = {
        ...updatedEtablissement,
        ...geoMapping,
      };
    }

    // CONVENTIONNEMENNT DATA
    if (scope.conventionnement) {
      const conventionData = await conventionController.getConventionData(
        current.siret,
        etablissement.uai,
        current.etablissement_siege_siret
      );

      updatedEtablissement = {
        ...updatedEtablissement,
        ...conventionData,
      };
    }

    // ONISEP DATA
    if (scope.onisep) {
      if (current.nom_academie && current.nom_academie !== "" && etablissement.uai && etablissement.uai !== "") {
        const results = await findOnisepInfosEtablissementFromUAI(etablissement.uai, current.nom_academie);
        if (Object.keys(results).length > 0) {
          const { nom: onisep_nom, cp: onisep_code_postal, lien_site_onisepfr: onisep_url } = results;
          updatedEtablissement = {
            ...updatedEtablissement,
            onisep_nom,
            onisep_code_postal,
            onisep_url,
          };
        }
      }
    }

    // just fill it when it's empty
    if ((!current.idcc || !current.opco_nom || !current.opco_siren) && updatedEtablissement.siren) {
      try {
        const resultsCfadock = await apiCfaDock.getOpcoData(updatedEtablissement.siren);
        updatedEtablissement = {
          ...updatedEtablissement,
          ...resultsCfadock,
        };
      } catch (error) {
        logger.error(`Unable to get opco data : ${error}`);
      }
    }

    if (Object.keys(updatedEtablissement).length > 0) {
      updatedEtablissement = {
        ...etablissement,
        ...updatedEtablissement,
      };

      const published = !updatedEtablissement.ferme && updatedEtablissement.api_entreprise_reference;
      updatedEtablissement.published = published;

      const { updates } = diffEtablissement(etablissement, updatedEtablissement);
      if (updates) {
        return { updates, etablissement: updatedEtablissement };
      }
    }

    return { updates: null, etablissement };
  } catch (e) {
    logger.error(e);
    return { updates: null, etablissement, error: e.toString() };
  }
};

module.exports.etablissementService = etablissementService;
