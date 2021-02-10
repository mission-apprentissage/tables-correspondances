const express = require("express");
const Boom = require("boom");
const Joi = require("joi");
const { Annuaire } = require("../../common/model");
const { paginateAggregation } = require("../../common/utils/mongooseUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/etablissements",
    tryCatch(async (req, res) => {
      let { filter, page, limit, sortBy } = await Joi.object({
        filter: Joi.string(),
        page: Joi.number().default(1),
        limit: Joi.number().default(10),
        sortBy: Joi.string().allow("uaisSecondaires", "liens"),
      }).validateAsync(req.query, { abortEarly: false });

      let query = filter ? { $text: { $search: filter } } : {};
      let sort = sortBy && [
        {
          $addFields: {
            ...(sortBy === "uaisSecondaires" ? { nb_uaisSecondaires: { $size: "$uaisSecondaires" } } : {}),
            ...(sortBy === "liens" ? { nb_liens: { $size: "$liens" } } : {}),
          },
        },
        { $sort: { [`nb_${sortBy}`]: -1 } },
      ];

      let { data: etablissements, pagination } = await paginateAggregation(
        Annuaire,
        [
          { $match: query },
          ...(sort ? sort : []),
          {
            $project: {
              nb_uaisSecondaires: 0,
              nb_liens: 0,
              _id: 0,
              __v: 0,
              _meta: 0,
            },
          },
        ],
        { page, limit }
      );

      return res.json({
        etablissements,
        pagination,
      });
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
