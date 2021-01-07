const { program: cli } = require("commander");
const { oleoduc, csvStream, jsonStream, stdoutStream } = require("oleoduc");
const { runScript } = require("../scriptWrapper");
const { createReadStream, createWriteStream } = require("fs");
const { findDEPPAnomalies, findDGEFPAnomalies } = require("./anomalies");

let anomalies = cli.command("anomalies").description("Commandes permettant de détecter des anomalies");
anomalies
  .command("depp [source] [target]")
  .description("Génère un fichier d'anomalies pour la DEPP")
  .option("--type <type>", "Type du fichier généré : json|csv(défaut)", "csv")
  .action((source, target, { type }) => {
    runScript(async () => {
      let input = source ? createReadStream(source) : process.stdin;
      let output = target ? createWriteStream(target) : stdoutStream();

      await oleoduc(findDEPPAnomalies(input), type === "csv" ? csvStream() : jsonStream(), output);
    });
  });

anomalies
  .command("dgefp [source] [target]")
  .description("Génère un fichier d'anomalies pour la DGEFP")
  .option("--type <type>", "Type du fichier généré : json|csv(défaut)", "csv")
  .action((source, target, { type }) => {
    runScript(async () => {
      let input = source ? createReadStream(source) : process.stdin;
      let output = target ? createWriteStream(target) : stdoutStream();

      await oleoduc(findDGEFPAnomalies(input), type === "csv" ? csvStream() : jsonStream(), output);
    });
  });

cli.parse(process.argv);
