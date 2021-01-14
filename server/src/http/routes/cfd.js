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
 * @swagger
 *
 * /cfd:
 *   post:
 *     summary: Permet de récupérer les informations relatives à un code formation diplôme donné. CFD
 *     description: >
 *       Cette api vous permet de récupérer les informations relatives à un CFD.<br/>
 *       Appels sous-jacent aux tables BCN V et N formations, MEF
 *     requestBody:
 *       description: L'objet JSON **doit** contenir la clé cfd.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cfd
 *             properties:
 *               cfd:
 *                 type: string
 *                 example: "26033206"
 *           examples:
 *             cfd:
 *               value: { "cfd": "26033206" }
 *               summary: Code CFD
 *             cfdpro:
 *               value: { "cfd": "36X32201" }
 *               summary: Code CFD pro
 *             cfdL:
 *               value: { "cfd": "26033206T" }
 *               summary: Code CFD avec lette de specialité
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
      logger.info("Looking for data on CFD: ", item);
      const result = await getDataFromCfd(item.cfd);
      return res.json(result);
    })
  );

  return router;
};
