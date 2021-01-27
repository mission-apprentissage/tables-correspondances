const express = require("express");
const Joi = require("joi");
const { oleoduc, jsonStream } = require("oleoduc");
const { Annuaire } = require("../../common/model");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/etablissements",
    tryCatch(async (req, res) => {
      let { value } = await Joi.object({
        value: Joi.string(),
      }).validateAsync(req.query, { abortEarly: false });

      await oleoduc(
        Annuaire.find(value ? { $or: [{ uai: value }, { siret: value }, { "uais_secondaires.uai": value }] } : {}, {
          _id: 0,
          __v: 0,
        })
          .lean()
          .cursor(),
        jsonStream(),
        res
      );
    })
  );

  return router;
};
