const logger = require("../../common/logger");
const Joi = require("joi");
const { getDataFromSiret } = require("../handlers/siretHandler");
const { getDataFromCP, getCoordaniteFromAdresseData } = require("../handlers/geoHandler");
const conventionController = require("../controllers/conventionController");
const { diffEtablissement } = require("../../common/utils/diffUtils");

const etablissementSchema = Joi.object({
  siret: Joi.string().required(),
  uai: Joi.string().allow(null).required(),
}).unknown();

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

const etablissementService = async (etablissement, { withHistoryUpdate = true } = {}) => {
  try {
    await etablissementSchema.validateAsync(etablissement, { abortEarly: false });

    // ENTREPRISE DATA
    const { result: siretMapping, messages: siretMessages } = await getDataFromSiret(etablissement.siret);

    let error = parseErrors(siretMessages);
    if (error) {
      return { updates: null, etablissement, error };
    }

    // CODE POSTAL DATA
    const { result: cpMapping, messages: cpMessages } = await getDataFromCP(siretMapping.code_postal);
    error = parseErrors(cpMessages);
    if (error) {
      return { updates: null, etablissement, error };
    }

    // GEOLOC DATA
    const { result: geoMapping, messages: geoMessages } = await getCoordaniteFromAdresseData({
      ...siretMapping,
      ...cpMapping,
    });
    error = parseErrors(geoMessages);

    // CONVENTIONNEMENNT DATA
    const conventionData = await conventionController.getConventionData(
      siretMapping.siret,
      etablissement.uai,
      siretMapping.etablissement_siege_siret
    );

    if (error) {
      return { updates: null, etablissement, error };
    }

    let updatedEtablissement = {
      ...etablissement,
      ...siretMapping,
      ...cpMapping,
      ...geoMapping,
      ...conventionData,
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

    return { updates: null, etablissement };
  } catch (e) {
    logger.error(e);
    return { updates: null, etablissement, error: e.toString() };
  }
};

module.exports.etablissementService = etablissementService;
