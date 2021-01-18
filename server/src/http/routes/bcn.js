const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { BcnFormationDiplome } = require("../../common/model");

/**
 * Sample entity route module for GET
 */
module.exports = () => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /bcn/formationsDiplomes:
   *   get:
   *     summary: Recherche dans les tables BCN N_Formation_diplome et V_Formation_diplome
   *     tags:
   *       - BCN
   *     description: >
   *       Permet, à l'aide de critères, de rechercher des formations dans les tables BCN N_Formation_diplome et V_Formation_diplome <br/><br/>
   *       **Pour definir vos critères de recherche veuillez regarder le schéma bcnFormationDiplomes (en bas de cette page)**
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
   *               example: "{\"FORMATION_DIPLOME\": \"01022404\"}"
   *             page:
   *               type: number
   *               example: 1
   *             limit:
   *               type: number
   *               example: 10
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  formationsDiplomes:
   *                    type: array
   *                    items:
   *                      $ref: '#/components/schemas/bcnFormationDiplomes'
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
    "/formationsDiplomes",
    tryCatch(async (req, res) => {
      let qs = req.query;
      const query = qs && qs.query ? JSON.parse(qs.query) : {};
      const page = qs && qs.page ? qs.page : 1;
      const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 10;

      const allData = await BcnFormationDiplome.paginate(query, { page, limit });
      return res.json({
        formationsDiplomes: allData.docs,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.pages,
          total: allData.total,
        },
      });
    })
  );

  return router;
};
