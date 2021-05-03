const express = require("express");
const logger = require("../../common/logger");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { getCoordinatesFromAddressData } = require("../../logic/handlers/geoHandler");

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
 * @swagger
 *
 * /coordinate:
 *   post:
 *     summary: Permet de récupérer les informations relatives à une adresse.
 *     tags:
 *       - Outils
 *     description: >
 *       Cette api vous permet de récupérer les informations relatives à une adresse.<br/>
 *       Appels sous-jacent API adresse BAN
 *     requestBody:
 *       description: L'objet JSON **doit** contenir toutes les clés décrite ci-dessous.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_voie
 *               - type_voie
 *               - nom_voie
 *               - code_postal
 *               - localite
 *             properties:
 *               numero_voie:
 *                 type: string
 *                 example: "76"
 *               type_voie:
 *                 type: string
 *                 example: "avenue"
 *               nom_voie:
 *                 type: string
 *                 example: "de Ségur"
 *               code_postal:
 *                 type: string
 *                 example: "75007"
 *               localite:
 *                 type: string
 *                 example: "Paris"
 *           examples:
 *             siret:
 *               value: { "numero_voie": "76", "type_voie": "avenue", "nom_voie": "de Ségur", "code_postal": "75007", "localite": "Paris" }
 *               summary: Adresse Beta.gouv
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
      logger.info("Looking for data on give adresse: ", item);
      const result = await getCoordinatesFromAddressData(item);
      return res.json(result);
    })
  );

  return router;
};
