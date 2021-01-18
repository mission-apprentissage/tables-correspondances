const { program: cli } = require("commander");
const { oleoduc, csvStream, jsonStream, stdoutStream } = require("oleoduc");
const { Readable } = require("stream");
const { runScript } = require("../scriptWrapper");
const { createReadStream, createWriteStream } = require("fs");
const annuaire = require("./annuaire");
const { findMissingDEPPInCatalogue, findMissingDGEFPInCatalogue, findMissingCatalogueInDGEFP } = require("./manquants");
const { invalidSiretsStream, getDoublons } = require("./anomalies");

cli
  .command("reset [depp]")
  .description("Réinitialise l'annuaire avec les données de la DEPP")
  .action((depp) => {
    runScript(() => {
      let deppStream = depp ? createReadStream(depp) : process.stdin;

      return annuaire.reset(deppStream);
    });
  });

cli
  .command("addUAIs <type> [source]")
  .description("Ajout les données de la source dans l'annuaire")
  .action((type, source) => {
    runScript(() => {
      let stream = source ? createReadStream(source) : process.stdin;

      return annuaire.addUAIs(type, stream);
    });
  });

const newExportCommand = (definition, options = { parent: cli }) => {
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

let manquants = cli.command("manquants").description("Gestion des établissements manquants");
newExportCommand("exportDeppInCatalogue [depp]", { parent: manquants })
  .description("Trouve les établissements de le DEPP qui ne sont pas dans le catalogue")
  .action((depp, { format, out }) => {
    runScript(async () => {
      let deppStream = depp ? createReadStream(depp) : process.stdin;

      let missing = await findMissingDEPPInCatalogue(deppStream);

      await oleoduc(Readable.from(missing), format, out);
    });
  });

newExportCommand("exportDgefpInCatalogue [dgefp]", { parent: manquants })
  .description("Trouve les établissements de la DGFEP qui ne sont pas dans le catalogue")
  .action((dgefp, { format, out }) => {
    runScript(async () => {
      let dgefpStream = dgefp ? createReadStream(dgefp) : process.stdin;

      let missing = await findMissingDGEFPInCatalogue(dgefpStream);

      await oleoduc(Readable.from(missing), format, out);
    });
  });

let anomalies = cli.command("anomalies").description("Gestion des anomalies dans les fichiers source");

newExportCommand("exportCatalogueInDGEFP [dgefp]", { parent: manquants })
  .description("Trouve les établissements du catalogue qui ne sont présents dans le fichier de la DGEFP")
  .action((dgefp, { format, out }) => {
    runScript(async () => {
      let dgefpStream = dgefp ? createReadStream(dgefp) : process.stdin;

      let missing = await findMissingCatalogueInDGEFP(dgefpStream);

      await oleoduc(Readable.from(missing), format, out);
    });
  });
newExportCommand("exportInvalidSirets <type> [input]", { parent: anomalies })
  .description("Génère un fichier d'anomalies à partir d'un fichier source")
  .action((type, input, { out, format }) => {
    runScript(async () => {
      let source = input ? createReadStream(input) : process.stdin;

      let stream = invalidSiretsStream(type, source);

      await oleoduc(stream, format, out);
    });
  });

newExportCommand("exportDoublons <type> [input]", { parent: anomalies })
  .description("Permet d'obtenir la liste des doublons dans un fichier source")
  .action((type, input, { out, format }) => {
    runScript(async () => {
      let source = input ? createReadStream(input) : process.stdin;

      let doublons = await getDoublons(type, source);

      await oleoduc(Readable.from(doublons), format, out);
    });
  });

cli.parse(process.argv);
