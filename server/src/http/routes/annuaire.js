const express = require("express");
const Joi = require("joi");
const { oleoduc, jsonStream } = require("oleoduc");
const { Annuaire } = require("../../common/model");
const { paginate } = require("../../common/utils/mongooseUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/etablissements",
    tryCatch(async (req, res) => {
      let { filter, page, limit } = await Joi.object({
        filter: Joi.string(),
        page: Joi.number().default(1),
        limit: Joi.number().default(10),
      }).validateAsync(req.query, { abortEarly: false });

      let query = filter ? { $text: { $search: filter } } : {};
      let { find, pagination } = await paginate(Annuaire, query, { page, limit });

      await oleoduc(
        find
          .select({
            _id: 0,
            __v: 0,
          })
          .cursor(),
        jsonStream({
          arrayPropertyName: "etablissements",
          arrayWrapper: {
            pagination,
          },
        }),
        res
      );
    })
  );

  return router;
};
