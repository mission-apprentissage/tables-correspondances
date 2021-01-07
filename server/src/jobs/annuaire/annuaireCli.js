const path = require("path");
const { program: cli } = require("commander");
const { runScript } = require("../scriptWrapper");
const { createReadStream } = require("fs");
const { exportInvalidSiretFromDEPP, exportInvalidSiretFromDGEFP } = require("./anomalies");

let anomalies = cli.command("anomalies").description("Commandes permettant de détecter des anomalies");
anomalies
  .command("depp [csvFile]")
  .description("Génère des fichiers d'anomalies pour le fichier csv de la depp")
  .action((csvFile) => {
    runScript(async () => {
      let outputDir = path.join(__dirname, "../../../.local/output");

      await exportInvalidSiretFromDEPP(
        csvFile ? createReadStream(csvFile) : process.stdin,
        path.join(outputDir, "invalid-siret-depp.csv")
      );
    });
  });

anomalies
  .command("dgefp [csvFile]")
  .description("Génère des fichiers d'anomalies pour le fichier csv de la dgefp")
  .action((csvFile) => {
    runScript(async () => {
      let outputDir = path.join(__dirname, "../../../.local/output");

      await exportInvalidSiretFromDGEFP(
        csvFile ? createReadStream(csvFile) : process.stdin,
        path.join(outputDir, "invalid-siret-dgefp.csv")
      );
    });
  });

cli.parse(process.argv);
