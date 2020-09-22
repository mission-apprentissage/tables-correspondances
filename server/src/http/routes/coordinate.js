const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { getCoordaniteFromAdresseData } = require("../../logic/handlers/geoHandler");

/**
 * Request body validation
 */
const requestSchema = Joi.object({
  numero_voie: Joi.string(),
  type_voie: Joi.string(),
  nom_voie: Joi.string().required(),
  code_postal: Joi.string().required(),
  localite: Joi.string().required(),
});

/**
 * Route which returns information about a given Adresse
 */
module.exports = () => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await requestSchema.validateAsync(req.body, { abortEarly: false });
      const item = req.body;
      logger.info("Looking for data on give adresse: ", item);
      const result = await getCoordaniteFromAdresseData(item);
      return res.json(result);
    })
  );

  return router;
};
