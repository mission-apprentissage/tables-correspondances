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
      let { filter } = await Joi.object({
        filter: Joi.string(),
      }).validateAsync(req.query, { abortEarly: false });

      await oleoduc(
        Annuaire.find(filter ? { $or: [{ uai: filter }, { siret: filter }, { "uais_secondaires.uai": filter }] } : {}, {
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
