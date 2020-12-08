const logger = require("../../common/logger");
const Joi = require("joi");
const { getDataFromSiret } = require("../handlers/siretHandler");
const { getDataFromCP } = require("../handlers/geoHandler");
// const { etablissementsMapper } = require("../mappers/etablissementsMapper");
// const { diffFormation } = require("../common/utils/diffUtils");

const etablissementSchema = Joi.object({
  siret: Joi.string().required(),
}).unknown();

/*
 * Build updates history
 */
// const buildUpdatesHistory = (formation, updates, keys) => {
//   const from = keys.reduce((acc, key) => {
//     acc[key] = formation[key];
//     return acc;
//   }, {});
//   return [...formation.updates_history, { from, to: { ...updates }, updated_at: Date.now() }];
// };

const parseErrors = (messages) => {
  if (!messages) {
    return "";
  }
  return Object.entries(messages)
    .filter(([key, value]) => key === "error" || `${value}`.toLowerCase().includes("erreur"))
    .reduce((acc, [key, value]) => `${acc}${acc ? " " : ""}${key}: ${value}.`, "");
};

const etablissementUpdater = async (etablissement) => {
  // const etablissementUpdater = async (etablissement, { withHistoryUpdate = true } = {}) => {
  try {
    await etablissementSchema.validateAsync(etablissement, { abortEarly: false });

    const { result: siretMapping, messages: siretMessages } = await getDataFromSiret(etablissement.siret);

    let error = parseErrors(siretMessages);
    if (error) {
      return { updates: null, etablissement, error };
    }

    // siretMapping
    const { result: cpMapping, messages: cpMessages } = await getDataFromCP(siretMapping.code_postal);
    error = parseErrors(cpMessages);
    if (error) {
      return { updates: null, etablissement, error };
    }

    // TODO FORMATIONS DATA
    // TODO CONVENTIONNEMENNT DATA
    // TODO GEO LOC

    // const cachedCpResult = { [formation.code_postal]: { result: cpMapping, messages: cpMessages } };
    // const { result: etablissementsMapping, messages: etablissementsMessages } = await etablissementsMapper(
    //   formation.etablissement_gestionnaire_siret,
    //   formation.etablissement_formateur_siret,
    //   cachedCpResult
    // );

    // error = parseErrors(etablissementsMessages);
    // if (error) {
    //   return { updates: null, formation, error };
    // }

    let updatedEtablissement = {
      ...etablissement,
      ...siretMapping,
      ...cpMapping,
      // ...etablissementsMapping,
      // published,
      // update_error: null,
    };

    const published =
      updatedEtablissement.ferme ||
      // !updatedEtablissement.formations_attachees ||
      !updatedEtablissement.api_entreprise_reference;

    updatedEtablissement.published = published;

    // const { updates, keys } = diffFormation(formation, updatedFormation);
    // if (updates) {
    //   if (withHistoryUpdate) {
    //     updatedFormation.updates_history = buildUpdatesHistory(formation, updates, keys);
    //   }
    //   return { updates, etablissement: updatedEtablissement };
    // }

    // return { updates: null, etablissement };
  } catch (e) {
    logger.error(e);
    return { updates: null, etablissement, error: e.toString() };
  }
};

module.exports.etablissementUpdater = etablissementUpdater;
