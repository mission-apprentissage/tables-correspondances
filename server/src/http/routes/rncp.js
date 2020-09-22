const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { getDataFromRncp } = require("../../logic/handlers/rncpHandler");

/**
 * Request body validation
 */
const requestSchema = Joi.object({
  rncp: Joi.string().required(),
});

/**
 * Route which returns information about a given RNCP
 */
module.exports = () => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await requestSchema.validateAsync(req.body, { abortEarly: false });
      const item = req.body;
      logger.info("Looking for data on rncp: ", item);
      const result = await getDataFromRncp(item.rncp);
      return res.json(result);
    })
  );

  return router;
};
