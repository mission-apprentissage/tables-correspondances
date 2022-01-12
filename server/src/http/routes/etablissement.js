const express = require("express");
const axios = require("axios");
const tryCatch = require("../middlewares/tryCatchMiddleware");

const CATALOGUE_API_URL =
  process.env.TABLES_CORRESPONDANCES_ENV === "production"
    ? "https://catalogue.apprentissage.beta.gouv.fr/api"
    : "https://catalogue-recette.apprentissage.beta.gouv.fr/api";

/**
 * Sample entity route module for GET
 */
module.exports = () => {
  const router = express.Router();

  router.get(
    "/etablissements",
    tryCatch(async (req, res) => {
      const { data } = await axios.get(`${CATALOGUE_API_URL}/entity/etablissements`, { params: req.query });
      return res.json(data);
    })
  );

  router.get(
    "/etablissements.ndjson",
    tryCatch(async (req, res) => {
      const { data } = await axios.get(`${CATALOGUE_API_URL}/entity/etablissements.ndjson`, {
        params: req.query,
      });
      return res.json(data);
    })
  );

  router.get(
    "/etablissements/count",
    tryCatch(async (req, res) => {
      const { data } = await axios.get(`${CATALOGUE_API_URL}/entity/etablissements/count`, { params: req.query });
      return res.json(data);
    })
  );

  router.get(
    "/etablissement",
    tryCatch(async (req, res) => {
      const { data } = await axios.get(`${CATALOGUE_API_URL}/entity/etablissement`, { params: req.query });
      return res.json(data);
    })
  );

  router.get(
    "/etablissement/:id",
    tryCatch(async (req, res) => {
      const { data } = await axios.get(`${CATALOGUE_API_URL}/entity/etablissement/${req.params.id}`);
      return res.json(data);
    })
  );

  return router;
};
