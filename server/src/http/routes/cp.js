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
 * Route which returns information about a given zipcode
 */
module.exports = () => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /code-postal:
   *   post:
   *     summary: Récupérer les informations relatives à un code postal.
   *     tags:
   *       - Outils
   *     description: >
   *       Cette api vous permet de récupérer les informations relatives à un code postal.<br/>
   *       Si <strong>malencontreusement</strong> vous appelez cette adresse avec un code commune Insee, l'api corrigera l'information
   *     requestBody:
   *       description: L'objet JSON **doit** contenir la clé codePostal.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - codePostal
   *             properties:
   *               codePostal:
   *                 type: string
   *                 example: "92600"
   *           examples:
   *             cp:
   *               value: { "codePostal": "92600" }
   *               summary: Code postal
   *             cc:
   *               value: { "codePostal": "92004" }
   *               summary: Code commune Insee
   *     responses:
   *       200:
   *         description: OK
   */
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
