const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const logger = require("../../common/logger");
const { getRomesAndLabelsFromTitleQuery } = require("../../logic/handlers/domainesMetiersHandler");

module.exports = () => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /domainesMetiers/romes:
   *   get:
   *     summary: Permet de ?
   *     tags:
   *       - DomainesMetiers
   *     description: >
   *       Permet de ?<br/>
   *     parameters:
   *       - in: query
   *         name: query
   *         required: true
   *         schema:
   *           type: object
   *           required:
   *             - title
   *           properties:
   *             title:
   *               type: string
   *               example: "test"
   *     responses:
   *       200:
   *         description: OK
   */
  router.get(
    "/romes",
    tryCatch(async (req, res) => {
      logger.info(`Recherche des codes ROMES depuis le titre`);
      const result = await getRomesAndLabelsFromTitleQuery(req.query);
      return res.json(result);
    })
  );

  return router;
};
