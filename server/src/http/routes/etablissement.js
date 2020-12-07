const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { Etablissement } = require("../../common/model");

/**
 * Sample entity route module for GET
 */
module.exports = () => {
  const router = express.Router();

  /**
   * Get all etablissements /etablissements GET
   * */
  router.get(
    "/etablissements",
    tryCatch(async (req, res) => {
      let qs = req.query;
      const query = qs && qs.query ? JSON.parse(qs.query) : {};
      const page = qs && qs.page ? qs.page : 1;
      const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 10;

      const allData = await Etablissement.paginate(query, { page, limit });
      return res.json({
        etablissements: allData.docs,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.pages,
          total: allData.total,
        },
      });
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

  return router;
};
