const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { etablissementService } = require("../../logic/services/etablissementService");

/**
 * Request body validation
 */
const requestSchema = Joi.object({
  siret: Joi.string().required(),
  scope: Joi.object().default(null),
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

      const { options = {}, ...item } = req.body;

      const scope = options.scope;
      const withHistoryUpdate = options.withHistoryUpdate ?? false;

      logger.info("Generate all data from", item, options);
      const result = await etablissementService(item, { withHistoryUpdate, scope });
      return res.json(result);
    })
  );

  return router;
};
