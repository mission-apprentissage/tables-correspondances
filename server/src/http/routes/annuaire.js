const express = require("express");
const Boom = require("boom");
const { oleoduc, jsonStream } = require("oleoduc");
const Joi = require("joi");
const { Annuaire } = require("../../common/model");
const { paginateAggregationWithCursor } = require("../../common/utils/mongooseUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/etablissements",
    tryCatch(async (req, res) => {
      let { text, erreurs, page, limit, sortBy, order } = await Joi.object({
        text: Joi.string(),
        erreurs: Joi.boolean().default(null),
        page: Joi.number().default(1),
        limit: Joi.number().default(10),
        order: Joi.number().allow(1, -1).default(-1),
        sortBy: Joi.string().allow("uaisSecondaires", "liens"),
      }).validateAsync(req.query, { abortEarly: false });

      let { cursor, pagination } = await paginateAggregationWithCursor(
        Annuaire,
        [
          {
            $match: {
              ...(text ? { $text: { $search: text } } : {}),
              ...(erreurs !== null ? { "_meta._errors.0": { $exists: erreurs } } : {}),
            },
          },
          ...(sortBy
            ? [
                {
                  $addFields: {
                    nb_uaisSecondaires: { $size: "$uaisSecondaires" },
                    nb_liens: { $size: "$liens" },
                  },
                },
                { $sort: { [`nb_${sortBy}`]: order } },
              ]
            : [{ $sort: { [`_meta.lastUpdate`]: -1 } }]),
          {
            $project: {
              nb_uaisSecondaires: 0,
              nb_liens: 0,
              _id: 0,
              __v: 0,
            },
          },
        ],
        { page, limit }
      );

      oleoduc(
        cursor,
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

  router.get(
    "/etablissements/:siret",
    tryCatch(async (req, res) => {
      let { siret } = await Joi.object({
        siret: Joi.string()
          .pattern(/^[0-9]{14}$/)
          .required(),
      }).validateAsync(req.params, { abortEarly: false });

      let etablissement = await Annuaire.findOne({ siret }, { _id: 0, __v: 0, _meta: 0 }).lean();
      if (!etablissement) {
        throw Boom.notFound("Siret inconnu");
      }

      return res.json(etablissement);
    })
  );

  return router;
};
