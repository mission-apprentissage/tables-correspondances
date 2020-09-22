const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { getDataFromCfd } = require("../../logic/handlers/cfdHandler");

/**
 * Request body validation
 */
const requestSchema = Joi.object({
  cfd: Joi.string().required(),
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
      logger.info("Looking for data on CFD: ", item);
      const result = await getDataFromCfd(item.cfd);
      return res.json(result);
    })
  );

  return router;
};
