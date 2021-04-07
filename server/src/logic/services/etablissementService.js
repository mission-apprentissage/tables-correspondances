const logger = require("../../common/logger");
//const Joi = require("joi");
const { getDataFromSiret } = require("../handlers/siretHandler");
const { getDataFromCP, getCoordaniteFromAdresseData } = require("../handlers/geoHandler");
const conventionController = require("../controllers/conventionController");
const { diffEtablissement } = require("../../common/utils/diffUtils");
const apiOnisep = require("../../common/apis/apiOnisep");

// const etablissementSchema = Joi.object({
//   siret: Joi.string().required(),
//   uai: Joi.string().allow(null).required(),
// }).unknown();

/*
 * Build updates history
 */
const buildUpdatesHistory = (etablissement, updates, keys) => {
  const from = keys.reduce((acc, key) => {
    acc[key] = etablissement[key];
    return acc;
  }, {});
  return [...etablissement.updates_history, { from, to: { ...updates }, updated_at: Date.now() }];
};

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
  {
    withHistoryUpdate = true,
    scope = { siret: true, location: true, geoloc: true, conventionnement: true, onisep: true },
  } = {}
) => {
  try {
    // await etablissementSchema.validateAsync(etablissement, { abortEarly: false });
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
    };

    let updatedEtablissement = {};

    // ENTREPRISE DATA
    if (scope.siret) {
      // console.log("Update siret info");
      const { result: siretMapping, messages: siretMessages } = await getDataFromSiret(etablissement.siret);

      let error = parseErrors(siretMessages);
      if (error) {
        return { updates: null, etablissement, error };
      }

      current.code_postal = siretMapping.code_postal;
      current.siret = siretMapping.siret;
      current.etablissement_siege_siret = siretMapping.etablissement_siege_siret;

      current.numero_voie = siretMapping.numero_voie;
      current.type_voie = siretMapping.type_voie;
      current.nom_voie = siretMapping.nom_voie;

      updatedEtablissement = {
        ...updatedEtablissement,
        ...siretMapping,
      };
    }

    // CODE POSTAL DATA
    if (scope.location) {
      // console.log("Update location info");
      const { result: cpMapping, messages: cpMessages } = await getDataFromCP(current.code_postal);
      error = parseErrors(cpMessages);
      if (error) {
        return { updates: null, etablissement, error };
      }

      current.code_postal = cpMapping.postal_code;
      current.code_commune_insee = cpMapping.code_commune_insee;
      current.commune = cpMapping.commune;
      current.num_departement = cpMapping.num_departement;
      current.nom_departement = cpMapping.nom_departement;
      current.region = cpMapping.region;
      current.num_region = cpMapping.num_region;
      current.nom_academie = cpMapping.nom_academie;
      current.num_academie = cpMapping.num_academie;

      updatedEtablissement = {
        ...updatedEtablissement,
        ...cpMapping,
      };
    }

    // GEOLOC DATA
    if (scope.geoloc) {
      // console.log("Update geoloc info");
      const { result: geoMapping, messages: geoMessages } = await getCoordaniteFromAdresseData({
        numero_voie: current.numero_voie,
        type_voie: current.type_voie,
        nom_voie: current.nom_voie,
        localite: current.commune,
        code_postal: current.code_postal,
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
      // console.log("Update conventionnement info");
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
        const { results } = await apiOnisep.getEtablissement({
          q: etablissement.uai,
          academie: current.nom_academie,
        });
        if (results.length === 1) {
          const { nom: onisep_nom, cp: onisep_code_postal, lien_site_onisepfr: onisep_url } = results[0];
          updatedEtablissement = {
            ...updatedEtablissement,
            onisep_nom,
            onisep_code_postal,
            onisep_url,
          };
        }
      }
    }

    if (Object.keys(updatedEtablissement).length > 0) {
      updatedEtablissement = {
        ...etablissement,
        ...updatedEtablissement,
      };

      const published = !updatedEtablissement.ferme && updatedEtablissement.api_entreprise_reference;
      updatedEtablissement.published = published;

      const { updates, keys } = diffEtablissement(etablissement, updatedEtablissement);
      if (updates) {
        if (withHistoryUpdate) {
          updatedEtablissement.updates_history = buildUpdatesHistory(etablissement, updates, keys);
        }
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
