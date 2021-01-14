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
 * @swagger
 *
 * /rncp:
 *   post:
 *     summary: Permet de récupérer les informations relatives à un code RNCP.
 *     tags:
 *       - Outils
 *     description: >
 *       Cette api vous permet de récupérer les informations relatives à un code RNCP.<br/>
 *       Appels sous-jacent aux données France Compétences
 *     requestBody:
 *       description: L'objet JSON **doit** contenir la clé rncp.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rncp
 *             properties:
 *               rncp:
 *                 type: string
 *                 example: "RNCP7571"
 *           examples:
 *             rncp:
 *               value: { "rncp": "RNCP7571" }
 *               summary: Code rncp
 *     responses:
 *       200:
 *         description: OK
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
