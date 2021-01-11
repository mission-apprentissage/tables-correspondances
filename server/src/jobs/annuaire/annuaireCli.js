const { program: cli } = require("commander");
const { stdoutStream } = require("oleoduc");
const { Readable } = require("stream");
const { runScript } = require("../scriptWrapper");
const { createReadStream, createWriteStream } = require("fs");
const { build } = require("./annuaire");
const { invalidSiretsStream, doublonsStream } = require("./anomalies");
const exporter = require("./exporter");

cli
  .command("build <depp> <dgefp>")
  .description("Construit l'annuaire des établissement")
  .option("--out <out>", "Fichier cible dans lequel seront stockés les établissements")
  .option("--format <format>", "Format : json|csv(défaut)", "csv")
  .action((depp, dgefp, options) => {
    runScript(async () => {
      let deppStream = createReadStream(depp);
      let dgefpStream = createReadStream(dgefp);
      let output = options.out ? createWriteStream(options.out) : stdoutStream();

      let { etablissements, stats } = await build(deppStream, dgefpStream);
      await exporter.export(Readable.from(etablissements), output, { format: options.format });

      return stats;
    });
  });

let anomalies = cli.command("anomalies").description("Gestion des anomalies dans les fichiers source");

anomalies
  .command("exportInvalidSirets <type> [input]")
  .description("Génère un fichier d'anomalies à partir d'un fichier source")
  .option("--out <out>", "Fichier cible dans lequel seront stockés les anomalies")
  .option("--format <format>", "Format : json|csv(défaut)", "csv")
  .action((type, input, { out, format }) => {
    runScript(async () => {
      let source = input ? createReadStream(input) : process.stdin;
      let output = out ? createWriteStream(out) : stdoutStream();

      let stream = invalidSiretsStream(type, source);

      await exporter.export(stream, output, { format });
    });
  });

anomalies
  .command("exportDoublons <type> [input]")
  .description("Génère un fichier de doublons à partir d'un fichier source")
  .option("--out <out>", "Fichier cible dans lequel seront stockés les doublons")
  .option("--format <format>", "Format : json|csv(défaut)", "csv")
  .action((type, input, { out, format }) => {
    runScript(async () => {
      let source = input ? createReadStream(input) : process.stdin;
      let output = out ? createWriteStream(out) : stdoutStream();

      let stream = await doublonsStream(type, source);

      await exporter.export(stream, output, { format });
    });
  });

cli.parse(process.argv);
