const express = require("express");
const config = require("config");
const logger = require("../common/logger");
const bodyParser = require("body-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
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
const services = require("./routes/services");
const cp = require("./routes/cp");
const rncp = require("./routes/rncp");
const uai = require("./routes/uai");
const siret = require("./routes/siret");
const coordinate = require("./routes/coordinate");
const entity = require("./routes/entity");
const secured = require("./routes/secured");
const login = require("./routes/login");
const authentified = require("./routes/authentified");
const admin = require("./routes/admin");
const password = require("./routes/password");
const stats = require("./routes/stats");
const bcn = require("./routes/bcn");

const etablissement = require("./routes/etablissement");

const swaggerSchema = require("../common/model/swaggerSchema");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tables de correspondances",
      version: "1.0.0",
      description: `Vous trouverez ici un ensemble d'outils de travail tel que Code-Postaux etc...<br/><br/>
      <h3><strong>${config.publicUrl}/api/v1</strong></h3><br/>
      Contact:
      `,
      contact: {
        name: "Mission Nationale Apprentissage",
        url: "https://mission-apprentissage.gitbook.io/general/",
        email: "catalogue@apprentissage.beta.gouv.fr",
      },
    },
    servers: [
      {
        url: `${config.publicUrl}/api/v1`,
      },
    ],
  },
  apis: ["./src/http/routes/*.js"],
};

const swaggerSpecification = swaggerJsdoc(options);

swaggerSpecification.components = {
  schemas: swaggerSchema,
};

module.exports = async (components) => {
  const { db } = components;
  const app = express();
  const checkJwtToken = authMiddleware(components);
  const adminOnly = permissionsMiddleware({ isAdmin: true });

  app.use(bodyParser.json({ limit: "50mb" }));
  // Parse the ndjson as text for ES proxy
  app.use(bodyParser.text({ type: "application/x-ndjson" }));

  app.use(corsMiddleware());
  app.use(logMiddleware());

  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification));
  app.get(
    "/api/v1/schema.json",
    tryCatch(async (req, res) => {
      return res.json(swaggerSpecification);
    })
  );

  app.use("/api/v1/entity", etablissement());
  app.use("/api/v1/services", services());
  app.use("/api/v1/bcn", bcn());
  app.use("/api/v1/cfd", cfd());
  app.use("/api/v1/mef", mef());
  app.use("/api/v1/code-postal", cp());
  app.use("/api/v1/rncp", rncp());
  app.use("/api/v1/uai", uai());
  app.use("/api/v1/siret", siret());
  app.use("/api/v1/coordinate", coordinate());
  app.use("/api/v1/entity", entity());
  app.use("/api/v1/secured", apiKeyAuthMiddleware, secured());
  app.use("/api/v1/login", login(components));
  app.use("/api/v1/authentified", checkJwtToken, authentified());
  app.use("/api/v1/admin", checkJwtToken, adminOnly, admin());
  app.use("/api/v1/password", password(components));
  app.use("/api/v1/stats", checkJwtToken, adminOnly, stats(components));

  /** DEPRECATED */
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification));
  app.use("/api/entity", etablissement());
  app.use("/api/services", services());
  app.use("/api/bcn", bcn());
  app.use("/api/cfd", cfd());
  app.use("/api/mef", mef());
  app.use("/api/code-postal", cp());
  app.use("/api/rncp", rncp());
  app.use("/api/uai", uai());
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
        name: `[Tables de correspondances] - ${config.appName}`,
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
        // config: config,
      });
    })
  );

  app.use(errorMiddleware());

  return app;
};
