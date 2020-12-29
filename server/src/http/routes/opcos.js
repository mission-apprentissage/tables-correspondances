const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { findOpcosFromIdccs, findIdccsFromCfd, findOpcosFromCfd } = require("../../logic/handlers/opcoHandler");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/opco",
    tryCatch(async (req, res) => {
      const { idccs = [], cfd } = req.query;
      let result;
      if (cfd) {
        result = await findOpcosFromCfd(cfd);
      } else {
        result = await findOpcosFromIdccs(idccs);
      }
      return res.json(result);
    })
  );

  router.get(
    "/idcc",
    tryCatch(async (req, res) => {
      const { cfd } = req.query;
      const result = await findIdccsFromCfd(cfd);
      return res.json(result);
    })
  );

  return router;
};
