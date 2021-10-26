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
    tryCatch(async (req) => {
      return await axios.get(`${CATALOGUE_API_URL}/entity/etablissements`, { params: req.query });
    })
  );

  router.get(
    "/etablissements.ndjson",
    tryCatch(async (req) => {
      return await axios.get(`${CATALOGUE_API_URL}/entity/etablissements.ndjson`, { params: req.query });
    })
  );

  router.get(
    "/etablissements/count",
    tryCatch(async (req) => {
      return await axios.get(`${CATALOGUE_API_URL}/entity/etablissements/count`, { params: req.query });
    })
  );

  router.get(
    "/etablissement",
    tryCatch(async (req) => {
      return await axios.get(`${CATALOGUE_API_URL}/entity/etablissement`, { params: req.query });
    })
  );

  router.get(
    "/etablissement/:id",
    tryCatch(async (req) => {
      return await axios.get(`${CATALOGUE_API_URL}/entity/etablissement/${req.params.id}`);
    })
  );

  router.get(
    "/etablissements/siret-uai",
    tryCatch(async (req) => {
      return await axios.get(`${CATALOGUE_API_URL}/entity/etablissements/siret-uai`, { params: req.query });
    })
  );

  return router;
};
