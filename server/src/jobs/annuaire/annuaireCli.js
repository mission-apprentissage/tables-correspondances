const { program: cli } = require("commander");
const { stdoutStream } = require("oleoduc");
const { runScript } = require("../scriptWrapper");
const { createReadStream, createWriteStream } = require("fs");
const sources = {
  depp: require("./depp"),
  dgefp: require("./dgefp"),
};

cli
  .command("anomalies <type> [source]")
  .description("Génère un fichier d'anomalies à partir d'un fichier source")
  .option("--out <out>", "Fichier cible dans lequel seront stockés les anomalies")
  .option("--format <format>", "Format des anomalies : json|csv(défaut)", "csv")
  .action((type, source, { out, format }) => {
    runScript(async () => {
      let input = source ? createReadStream(source) : process.stdin;
      let output = out ? createWriteStream(out) : stdoutStream();
      let exportAnomalies = sources[type].exportAnomalies;

      await exportAnomalies(input, output, { format });
    });
  });

cli
  .command("doublons <type> [source]")
  .description("Génère un fichier de doublons à partir d'un fichier source")
  .option("--out <out>", "Fichier cible dans lequel seront stockés les anomalies")
  .option("--format <format>", "Format des anomalies : json|csv(défaut)", "csv")
  .action((type, source, { out, format }) => {
    runScript(async () => {
      let input = source ? createReadStream(source) : process.stdin;
      let output = out ? createWriteStream(out) : stdoutStream();
      let exportDoublons = sources[type].exportDoublons;

      await exportDoublons(input, output, { format });
    });
  });

cli.parse(process.argv);
