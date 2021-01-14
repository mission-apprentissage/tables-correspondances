const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { validateUAI } = require("../../common/utils/uaiUtils");

module.exports = () => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /uai/{code}:
   *   get:
   *     summary: Permet de validiter le format un code UAI
   *     tags:
   *       - Outils
   *     description: >
   *       Permet de validiter le format un code UAI.<br/>
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         example: "0601610Z"
   *     responses:
   *       200:
   *         description: OK
   *       400:
   *         description: KO
   */
  router.get(
    "/:code",
    tryCatch(async (req, res) => {
      let { code } = await Joi.object({
        code: Joi.string().required(),
      }).validateAsync(req.params, { abortEarly: false });

      const isValid = validateUAI(code);
      return res.status(isValid ? 200 : 400).json({ code });
    })
  );

  return router;
};
