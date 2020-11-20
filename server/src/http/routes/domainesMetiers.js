const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const logger = require("../../common/logger");
const { getRomesAndLabelsFromTitleQuery } = require("../../logic/handlers/domainesMetiersHandler");

module.exports = () => {
  const router = express.Router();

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
