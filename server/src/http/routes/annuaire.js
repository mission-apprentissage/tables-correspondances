const express = require("express");
const Joi = require("joi");
const { omit } = require("lodash");
const { oleoduc, jsonStream, transformData } = require("oleoduc");
const { Annuaire } = require("../../common/model");
const { raw } = require("../../common/utils/mongooseUtils");
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
        Annuaire.find(
          value ? { $or: [{ uai: value }, { siret: value }, { "uais_secondaires.uai": value }] } : {}
        ).cursor(),
        transformData((doc) => omit(raw(doc), ["_id"])),
        jsonStream(),
        res
      );
    })
  );

  return router;
};
