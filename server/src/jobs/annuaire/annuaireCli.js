const { program: cli } = require("commander");
const { oleoduc, csvStream, jsonStream, stdoutStream } = require("oleoduc");
const { Readable } = require("stream");
const { runScript } = require("../scriptWrapper");
const { createReadStream, createWriteStream } = require("fs");
const { build } = require("./annuaire");
const { findMissingDEPPInCatalogue, findMissingDGEFPInCatalogue, findMissingCatalogueInDGEFP } = require("./manquants");
const { invalidSiretsStream, getDoublons } = require("./anomalies");

const newCommand = (definition, options = { parent: cli }) => {
  let cmd = options.parent.command(definition);
  cmd
    .option(
      "--out <out>",
      "Fichier cible dans lequel seront stockés les établissements (defaut: stdout)",
      (out) => createWriteStream(out),
      stdoutStream()
    )
    .option(
      "--format <format>",
      "Format : json|csv(défaut)",
      (format) => (format === "csv" ? csvStream() : jsonStream()),
      csvStream()
    );
  return cmd;
};

newCommand("build <depp> <dgefp>")
  .description("Construit l'annuaire des établissement")
  .action((depp, dgefp, { format, out }) => {
    runScript(async () => {
      let deppStream = createReadStream(depp);
      let dgefpStream = createReadStream(dgefp);

      let { etablissements, stats } = await build(deppStream, dgefpStream);

      await oleoduc(Readable.from(etablissements), format, out);

      return stats;
    });
  });

let manquants = cli.command("manquants").description("Gestion des établissements manquants");
newCommand("exportDeppInCatalogue [depp]", { parent: manquants })
  .description("Trouve les établissements de le DEPP qui ne sont pas dans le catalogue")
  .action((depp, { format, out }) => {
    runScript(async () => {
      let deppStream = depp ? createReadStream(depp) : process.stdin;

      let missing = await findMissingDEPPInCatalogue(deppStream);

      await oleoduc(Readable.from(missing), format, out);
    });
  });

newCommand("exportDgefpInCatalogue [dgefp]", { parent: manquants })
  .description("Trouve les établissements de la DGFEP qui ne sont pas dans le catalogue")
  .action((dgefp, { format, out }) => {
    runScript(async () => {
      let dgefpStream = dgefp ? createReadStream(dgefp) : process.stdin;

      let missing = await findMissingDGEFPInCatalogue(dgefpStream);

      await oleoduc(Readable.from(missing), format, out);
    });
  });

let anomalies = cli.command("anomalies").description("Gestion des anomalies dans les fichiers source");

newCommand("exportCatalogueInDGEFP [dgefp]", { parent: manquants })
  .description("Trouve les établissements du catalogue qui ne sont présents dans le fichier de la DGEFP")
  .action((dgefp, { format, out }) => {
    runScript(async () => {
      let dgefpStream = dgefp ? createReadStream(dgefp) : process.stdin;

      let missing = await findMissingCatalogueInDGEFP(dgefpStream);

      await oleoduc(Readable.from(missing), format, out);
    });
  });
newCommand("exportInvalidSirets <type> [input]", { parent: anomalies })
  .description("Génère un fichier d'anomalies à partir d'un fichier source")
  .action((type, input, { out, format }) => {
    runScript(async () => {
      let source = input ? createReadStream(input) : process.stdin;

      let stream = invalidSiretsStream(type, source);

      await oleoduc(stream, format, out);
    });
  });

newCommand("exportDoublons <type> [input]", { parent: anomalies })
  .description("Permet d'obtenir la liste des doublons dans un fichier source")
  .action((type, input, { out, format }) => {
    runScript(async () => {
      let source = input ? createReadStream(input) : process.stdin;

      let doublons = await getDoublons(type, source);

      await oleoduc(Readable.from(doublons), format, out);
    });
  });

cli.parse(process.argv);
