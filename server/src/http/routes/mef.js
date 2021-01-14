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
 * @swagger
 *
 * /mef:
 *   post:
 *     summary: Permet de récupérer les informations relatives à un code MEF.
 *     tags:
 *       - Outils
 *     description: >
 *       Cette api vous permet de récupérer les informations relatives à un MEF 10 caracteres.<br/>
 *       Appels sous-jacent aux tables BCN V et N formations, MEF
 *     requestBody:
 *       description: L'objet JSON **doit** contenir la clé mef.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mef
 *             properties:
 *               mef:
 *                 type: string
 *                 example: "4173320611"
 *           examples:
 *             mef:
 *               value: { "mef": "4173320611" }
 *               summary: Code mef
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
      logger.info("Looking for data on MEF: ", item);
      const result = await getDataFromMef10(item.mef);
      return res.json(result);
    })
  );

  return router;
};
