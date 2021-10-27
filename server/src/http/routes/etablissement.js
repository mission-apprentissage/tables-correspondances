const express = require("express");
const axios = require("axios");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { sendJsonStream } = require("../../common/utils/httpUtils");

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
      const stream = await axios.get(`${CATALOGUE_API_URL}/entity/etablissements`, { params: req.query });
      return sendJsonStream(stream, res);
    })
  );

  router.get(
    "/etablissements.ndjson",
    tryCatch(async (req, res) => {
      const stream = await axios.get(`${CATALOGUE_API_URL}/entity/etablissements.ndjson`, { params: req.query });
      return sendJsonStream(stream, res);
    })
  );

  router.get(
    "/etablissements/count",
    tryCatch(async (req, res) => {
      const data = await axios.get(`${CATALOGUE_API_URL}/entity/etablissements/count`, { params: req.query });
      return res.json(data);
    })
  );

  router.get(
    "/etablissement",
    tryCatch(async (req, res) => {
      const data = await axios.get(`${CATALOGUE_API_URL}/entity/etablissement`, { params: req.query });
      return res.json(data);
    })
  );

  router.get(
    "/etablissement/:id",
    tryCatch(async (req, res) => {
      const data = await axios.get(`${CATALOGUE_API_URL}/entity/etablissement/${req.params.id}`);
      return res.json(data);
    })
  );

  router.get(
    "/etablissements/siret-uai",
    tryCatch(async (req, res) => {
      const data = await axios.get(`${CATALOGUE_API_URL}/entity/etablissements/siret-uai`, { params: req.query });
      return res.json(data);
    })
  );

  return router;
};
