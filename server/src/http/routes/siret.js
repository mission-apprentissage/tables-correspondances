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
 * @swagger
 *
 * /siret:
 *   post:
 *     summary: Permet de récupérer les informations relatives à un code siret.
 *     tags:
 *       - Outils
 *     description: >
 *       Cette api vous permet de récupérer les informations relatives à un code siret.<br/>
 *       Appels sous-jacent API entreprise et API Sirene
 *     requestBody:
 *       description: L'objet JSON **doit** contenir la clé siret.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siret
 *             properties:
 *               siret:
 *                 type: string
 *                 example: "32922456200234"
 *           examples:
 *             siret:
 *               value: { "siret": "32922456200234" }
 *               summary: Code siret
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
      logger.info("Looking for data on siret: ", item);
      const result = await getDataFromSiret(item.siret);
      return res.json(result);
    })
  );

  return router;
};
