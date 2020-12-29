const express = require("express");
const config = require("config");
const logger = require("../common/logger");
const bodyParser = require("body-parser");
const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const tryCatch = require("./middlewares/tryCatchMiddleware");
const apiKeyAuthMiddleware = require("./middlewares/apiKeyAuthMiddleware");
const corsMiddleware = require("./middlewares/corsMiddleware");
const authMiddleware = require("./middlewares/authMiddleware");
const permissionsMiddleware = require("./middlewares/permissionsMiddleware");
const packageJson = require("../../package.json");
const cfd = require("./routes/cfd");
const mef = require("./routes/mef");
const cp = require("./routes/cp");
const rncp = require("./routes/rncp");
const siret = require("./routes/siret");
const coordinate = require("./routes/coordinate");
const entity = require("./routes/entity");
const secured = require("./routes/secured");
const login = require("./routes/login");
const authentified = require("./routes/authentified");
const admin = require("./routes/admin");
const password = require("./routes/password");
const stats = require("./routes/stats");
const esSearch = require("./routes/esSearch");
const esMultiSearchNoIndex = require("./routes/esMultiSearchNoIndex");
const domainesMetiers = require("./routes/domainesMetiers");
const opcos = require("./routes/opcos");

module.exports = async (components) => {
  const { db } = components;
  const app = express();
  const checkJwtToken = authMiddleware(components);
  const adminOnly = permissionsMiddleware({ isAdmin: true });

  app.use(bodyParser.json());
  app.use(corsMiddleware());
  app.use(logMiddleware());

  app.use("/api/opcos", opcos());
  app.use("/api/domainesMetiers", domainesMetiers());
  app.use("/api/es/search", esSearch());
  app.use("/api/search", esMultiSearchNoIndex());
  app.use("/api/cfd", cfd());
  app.use("/api/mef", mef());
  app.use("/api/code-postal", cp());
  app.use("/api/rncp", rncp());
  app.use("/api/siret", siret());
  app.use("/api/coordinate", coordinate());
  app.use("/api/entity", entity());
  app.use("/api/secured", apiKeyAuthMiddleware, secured());
  app.use("/api/login", login(components));
  app.use("/api/authentified", checkJwtToken, authentified());
  app.use("/api/admin", checkJwtToken, adminOnly, admin());
  app.use("/api/password", password(components));
  app.use("/api/stats", checkJwtToken, adminOnly, stats(components));

  app.get(
    "/api",
    tryCatch(async (req, res) => {
      let mongodbStatus;
      logger.info("/api called");
      await db
        .collection("sample")
        .stats()
        .then(() => {
          mongodbStatus = true;
        })
        .catch((e) => {
          mongodbStatus = false;
          logger.error("Healthcheck failed", e);
        });

      return res.json({
        name: `Serveur express MNA - ${config.appName}`,
        version: packageJson.version,
        env: config.env,
        healthcheck: {
          mongodb: mongodbStatus,
        },
      });
    })
  );

  app.get(
    "/api/config",
    tryCatch(async (req, res) => {
      return res.json({
        config: config,
      });
    })
  );

  app.use(errorMiddleware());

  return app;
};
