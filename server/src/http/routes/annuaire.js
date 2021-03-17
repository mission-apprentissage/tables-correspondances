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

  /**
   * @swagger
   *
   * /annuaire/etablissements:
   *   get:
   *     summary: Récupérer la liste des établissements de l'annuaire
   *     parameters:
   *       - in: query
   *         name: text
   *         description: Permet de faire une recherche sur tous les champs texte d'un établissement
   *         type: string
   *         required: false
   *       - in: query
   *         name: anomalies
   *         description: Si true renvoie uniquement les établissements contenant des anomalies
   *         type: string
   *         required: false
   *       - in: query
   *         name: page
   *         description: Le numéro de la page désirée
   *         type: string
   *         required: false
   *       - in: query
   *         name: items_par_page
   *         default: 10
   *         description: Le nombre maximum d'éléments dans la page
   *         type: string
   *       - in: query
   *         name: tri
   *         description: Le champ utilisé pour trier la liste des résultats
   *         type: string
   *       - in: query
   *         name: ordre
   *         description: L'ordre du tri
   *         default: desc
   *         type: string
   *         required: false
   *     produces:
   *      - application/json
   *     tags:
   *       - Annuaire
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  etablissements:
   *                    type: array
   *                    items:
   *                      $ref: '#/components/schemas/annuaire'
   *                  pagination:
   *                    type: object
   *                    properties:
   *                      page:
   *                        type: string
   *                      resultats_par_page:
   *                        type: number
   *                      nombre_de_page:
   *                        type: number
   *                      total:
   *                        type: number
   */
  router.get(
    "/etablissements",
    tryCatch(async (req, res) => {
      let { text, anomalies, page, items_par_page, tri, ordre } = await Joi.object({
        text: Joi.string(),
        anomalies: Joi.boolean().default(null),
        page: Joi.number().default(1),
        items_par_page: Joi.number().default(10),
        tri: Joi.string().valid("uais_secondaires", "relations"),
        ordre: Joi.string().valid("asc", "desc").default("desc"),
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
          ...(tri
            ? [
                {
                  $addFields: {
                    nb_uais_secondaires: { $size: "$uais_secondaires" },
                    nb_relations: { $size: "$relations" },
                  },
                },
                { $sort: { [`nb_${tri}`]: ordre === "asc" ? 1 : -1 } },
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
        { page, limit: items_par_page }
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

  /**
   * @swagger
   *
   * /annuaire/etablissements/:siret:
   *   get:
   *     summary: Récupérer les informations d'un établissement
   *     parameters:
   *       - in: path
   *         name: text
   *         description: Le numéro de siret de l'établissement
   *         type: string
   *         required: true
   *     produces:
   *      - application/json
   *     tags:
   *       - Annuaire
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/annuaire'
   */
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
