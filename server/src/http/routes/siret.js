const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { getDataFromSiret } = require("../../logic/handlers/siretHandler");

/**
 * Request body validation
 */
const requestSchema = Joi.object({
  siret: Joi.string().required(),
});

/**
 * Route which returns information about a given Siret
 */
module.exports = () => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await requestSchema.validateAsync(req.body, { abortEarly: false });
      const item = req.body;
      logger.info("Looking for data on siret: ", item);
      const result = await getDataFromSiret(item.siret);
      return res.json(result);
    })
  );

  return router;
};
