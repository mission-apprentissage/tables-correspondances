const express = require("express");
const Joi = require("joi");
const { oleoduc, transformIntoJSON } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { sendJsonStream } = require("../utils/httpUtils");
const { paginate } = require("../../common/utils/mongooseUtils");
const { Etablissement } = require("../../common/model");

/**
 * Sample entity route module for GET
 */
module.exports = () => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /entity/etablissements:
   *   get:
   *     summary: Permet de récupérer les établissements
   *     tags:
   *       - Etablissements
   *     description: >
   *       Permet, à l'aide de critères, de rechercher dans la table établissements<br/><br/>
   *       Le champ Query est une query Mongo stringify<br/><br/>
   *       **Pour definir vos critères de recherche veuillez regarder le schéma etablissement (en bas de cette page)**
   *     parameters:
   *       - in: query
   *         name: payload
   *         required: true
   *         schema:
   *           type: object
   *           required:
   *             - query
   *           properties:
   *             query:
   *               type: string
   *               example: '"{\"siret\": \"13001727000401\"}"'
   *             page:
   *               type: number
   *               example: 1
   *             limit:
   *               type: number
   *               example: 10
   *         examples:
   *           siret:
   *             value: { query: "{\"siret\": \"13001727000401\"}", page: 1, limit: 10 }
   *             summary: Recherche par siret
   *           sireteUAI:
   *             value: { query: "{\"siret\": \"13001727000401\", \"uai\": \"0781981E\"}" }
   *             summary: Recherche par siret et Uai
   *           siretoUai:
   *             value: { query: "{\"$or\":[{\"siret\":\"13001727000310\"},{\"uai\":\"0781981E\"}]}" }
   *             summary: Recherche par siret **OU** par Uai
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
   *                      $ref: '#/components/schemas/etablissement'
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
      let { query, page, limit } = await Joi.object({
        query: Joi.string().default("{}"),
        page: Joi.number().default(1),
        limit: Joi.number().default(10),
      }).validateAsync(req.query, { abortEarly: false });

      let json = JSON.parse(query);
      let { find, pagination } = await paginate(Etablissement, json, { page, limit });
      let stream = oleoduc(
        find.cursor(),
        transformIntoJSON({
          arrayWrapper: {
            pagination,
          },
          arrayPropertyName: "etablissements",
        })
      );

      return sendJsonStream(stream, res);
    })
  );

  /**
   * Get count etablissements/count GET
   */
  router.get(
    "/etablissements/count",
    tryCatch(async (req, res) => {
      let qs = req.query;
      const query = qs && qs.query ? JSON.parse(qs.query) : {};
      const retrievedData = await Etablissement.countDocuments(query);
      if (retrievedData) {
        res.json(retrievedData);
      } else {
        res.json({ message: `Item doesn't exist` });
      }
    })
  );

  /**
   * Get etablissement  /etablissement GET
   */
  router.get(
    "/etablissement",
    tryCatch(async (req, res) => {
      let qs = req.query;
      const query = qs && qs.query ? JSON.parse(qs.query) : {};
      const retrievedData = await Etablissement.findOne(query);
      if (retrievedData) {
        res.json(retrievedData);
      } else {
        res.json({ message: `Etablissement doesn't exist` });
      }
    })
  );

  /**
   * Get etablissement by id /etablissement/{id} GET
   */
  router.get(
    "/etablissement/:id",
    tryCatch(async (req, res) => {
      const itemId = req.params.id;
      const retrievedData = await Etablissement.findById(itemId);
      if (retrievedData) {
        res.json(retrievedData);
      } else {
        res.json({ message: `Etablissement ${itemId} doesn't exist` });
      }
    })
  );

  /**
   * @swagger
   *
   * /entity/etablissements/siret-uai:
   *   get:
   *     summary: Permet de recherche des établissements par siret ou/et uai ou/et adresse
   *     tags:
   *       - Etablissements
   *     description: >
   *       Permet, à l'aide de critères, de rechercher dans la table établissements<br/><br/>
   *       Le champ Query est une query Mongo stringify<br/><br/>
   *       **Pour definir vos critères de recherche veuillez regarder le schéma etablissement (en bas de cette page)**
   *     parameters:
   *       - in: query
   *         name: payload
   *         required: true
   *         schema:
   *           type: object
   *           required:
   *             - query
   *           properties:
   *             query:
   *               type: string
   *               example: '"{\"siret\": \"13001727000401\"}"'
   *             page:
   *               type: number
   *               example: 1
   *             limit:
   *               type: number
   *               example: 10
   *         examples:
   *           adresse:
   *             value: { query: "{\"adresse\":\"2915 RtE DES BarTHES 40180\"}" }
   *             summary: Recherche par adresse
   *           siret:
   *             value: { query: "{\"siret\": \"13001727000401\"}", page: 1, limit: 10 }
   *             summary: Recherche par siret
   *           sireteUAI:
   *             value: { query: "{\"siret\": \"13001727000401\", \"uai\": \"0781981E\"}" }
   *             summary: Recherche par siret et Uai
   *           siretoUai:
   *             value: { query: "{\"$or\":[{\"siret\":\"13001727000310\"},{\"uai\":\"0781981E\"}]}" }
   *             summary: Recherche par siret **OU** par Uai
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
   *                      $ref: '#/components/schemas/etablissement'
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
    "/etablissements/siret-uai",
    tryCatch(async (req, res) => {
      let qs = req.query;
      const query = qs && qs.query ? JSON.parse(qs.query) : {};
      const page = qs && qs.page ? qs.page : 1;
      const limit = qs && qs.limit ? parseInt(qs.limit, 3) : 3;

      let results = { docs: [] };
      if (query.adresse) {
        await Etablissement.createIndexes();
        let search = await Etablissement.find(
          {
            $text: {
              $search: query.adresse,
              $caseSensitive: false,
            },
          },
          {
            score: {
              $meta: "textScore",
            },
          }
        ).sort({ score: { $meta: "textScore" } });
        search = search.slice(0, limit);
        results.docs = search;
        results.pages = 1;
        results.page = 1;
        results.total = limit;
      } else {
        results = await Etablissement.paginate(query, { page, limit });
      }

      const etablissements = results.docs.map((eta) => {
        // eslint-disable-next-line no-underscore-dangle
        const e = { ...eta._doc };
        delete e.formations_attachees;
        delete e.formations_ids;
        delete e.formations_n3;
        delete e.formations_n4;
        delete e.formations_n5;
        delete e.formations_n6;
        delete e.formations_n7;
        delete e.info_depp;
        delete e.info_dgefp;
        delete e.info_datagouv_ofs;
        delete e.info_datadock;

        delete e.api_entreprise_reference;
        delete e.parcoursup_a_charger;
        delete e.affelnet_a_charger;

        delete e.ds_id_dossier;
        delete e.ds_questions_siren;
        delete e.ds_questions_nom;
        delete e.ds_questions_email;
        delete e.ds_questions_uai;
        delete e.ds_questions_has_agrement_cfa;
        delete e.ds_questions_has_certificaton_2015;
        delete e.ds_questions_has_ask_for_certificaton;
        delete e.ds_questions_ask_for_certificaton_date;
        delete e.ds_questions_declaration_code;
        delete e.ds_questions_has_2020_training;
        delete e.catalogue_published;
        delete e.published;
        // eslint-disable-next-line no-underscore-dangle
        delete e._id;
        delete e.created_at;
        delete e.last_update_at;
        // eslint-disable-next-line no-underscore-dangle
        delete e.__v;
        delete e.etablissement_siege_id;
        delete e.rco_adresse;
        delete e.rco_code_insee_localite;
        delete e.rco_code_postal;
        delete e.rco_uai;
        delete e.tags;

        return e;
      });

      return res.json({
        etablissements: etablissements,
        pagination: {
          page: results.page,
          resultats_par_page: limit,
          nombre_de_page: results.pages,
          total: results.total,
        },
      });
    })
  );

  return router;
};
