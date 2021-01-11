const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { etablissementService } = require("../../logic/services/Etablissement");

/**
 * Request body validation
 */
const requestSchema = Joi.object({
  siret: Joi.string().required(),
}).unknown();

/**
 * Route which returns information about a given Mef
 */
module.exports = () => {
  const router = express.Router();

  router.post(
    "/etablissement",
    tryCatch(async (req, res) => {
      await requestSchema.validateAsync(req.body, { abortEarly: false });
      const item = req.body;
      logger.info("Generate all data from", item);
      const result = await etablissementService(item);
      return res.json(result);
    })
  );

  return router;
};
