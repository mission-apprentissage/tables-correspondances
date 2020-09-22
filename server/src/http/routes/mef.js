const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { getDataFromMef10 } = require("../../logic/handlers/mefHandler");

/**
 * Request body validation
 */
const requestSchema = Joi.object({
  mef: Joi.string().required(),
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
      logger.info("Looking for data on MEF: ", item);
      const result = await getDataFromMef10(item.mef);
      return res.json(result);
    })
  );

  return router;
};
