const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { stdoutStream } = require("oleoduc");
const { runScript } = require("../scriptWrapper");
const { createReadStream } = require("fs");
const annuaire = require("./annuaire");
const { createSource } = require("./sources/sources");

cli
  .command("reset [depp]")
  .description("Réinitialise l'annuaire avec les données de la DEPP")
  .action((depp) => {
    runScript(async () => {
      let stream = depp ? createReadStream(depp) : process.stdin;

      await annuaire.deleteAll();
      return annuaire.initialize(stream);
    });
  });

cli
  .command("collect <type> [input]")
  .description("Collecte les données contenues dans la source")
  .action((type, input) => {
    runScript(() => {
      let stream = input ? createReadStream(input) : process.stdin;

      let source = createSource(type, { stream });
      return annuaire.collect(type, source);
    });
  });

cli
  .command("export")
  .description("Exporte l'annuaire")
  .option(
    "--out <out>",
    "Fichier cible dans lequel sera stocké l'export (defaut: stdout)",
    (out) => createWriteStream(out),
    stdoutStream()
  )
  .option("--format <format>", "Format : json|csv(défaut)")
  .action(({ out, format }) => {
    runScript(() => {
      return annuaire.export(out, { format });
    });
  });

cli.parse(process.argv);
