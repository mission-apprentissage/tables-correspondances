const express = require("express");
const Boom = require("boom");
const { oleoduc, transformIntoJSON } = require("oleoduc");
const Joi = require("joi");
const { Annuaire } = require("../../common/model");
const { paginateAggregationWithCursor } = require("../../common/utils/mongooseUtils");
const { sendJsonStream } = require("../utils/httpUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/etablissements",
    tryCatch(async (req, res) => {
      let { text, anomalies, page, limit, sortBy, order } = await Joi.object({
        text: Joi.string(),
        anomalies: Joi.boolean().default(null),
        page: Joi.number().default(1),
        limit: Joi.number().default(10),
        order: Joi.number().allow(1, -1).default(-1),
        sortBy: Joi.string().allow("uais_secondaires", "relations"),
      }).validateAsync(req.query, { abortEarly: false });

      let { cursor, pagination } = await paginateAggregationWithCursor(
        Annuaire,
        [
          {
            $match: {
              ...(text ? { $text: { $search: text } } : {}),
              ...(anomalies !== null ? { "_meta.anomalies.0": { $exists: anomalies } } : {}),
            },
          },
          ...(sortBy
            ? [
                {
                  $addFields: {
                    nb_uais_secondaires: { $size: "$uais_secondaires" },
                    nb_relations: { $size: "$relations" },
                  },
                },
                { $sort: { [`nb_${sortBy}`]: order } },
              ]
            : [{ $sort: { [`_meta.lastUpdate`]: -1 } }]),
          {
            $project: {
              nb_uais_secondaires: 0,
              nb_relations: 0,
              _id: 0,
              __v: 0,
            },
          },
        ],
        { page, limit }
      );

      sendJsonStream(
        oleoduc(
          cursor,
          transformIntoJSON({
            arrayPropertyName: "etablissements",
            arrayWrapper: {
              pagination,
            },
          })
        ),
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
