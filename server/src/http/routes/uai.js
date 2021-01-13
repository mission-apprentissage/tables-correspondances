const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { validateUAI } = require("../../common/utils/uaiUtils");

module.exports = () => {
  const router = express.Router();

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
