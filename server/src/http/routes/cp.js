const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { getDataFromCP } = require("../../logic/handlers/geoHandler");

/**
 * Request body validation
 */
const requestSchema = Joi.object({
  codePostal: Joi.string().required(),
});

/**
 * Route which returns information about a given CFD
 */
module.exports = () => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await requestSchema.validateAsync(req.body, { abortEarly: false });
      const item = req.body;
      logger.info("Looking for data on Zip code: ", item);
      const result = await getDataFromCP(item.codePostal);
      return res.json(result);
    })
  );

  return router;
};
