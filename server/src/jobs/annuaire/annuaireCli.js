const { program: cli } = require("commander");
const { runScript } = require("../scriptWrapper");
const { createReadStream } = require("fs");
const annuaire = require("./annuaire");

cli
  .command("reset [depp]")
  .description("Réinitialise l'annuaire avec les données de la DEPP")
  .action((depp) => {
    runScript(async () => {
      let deppStream = depp ? createReadStream(depp) : process.stdin;

      await annuaire.deleteAll();
      return annuaire.initialize(deppStream);
    });
  });

cli
  .command("collect <type> [source]")
  .description("Ajout les données de la source dans l'annuaire")
  .action((type, source) => {
    runScript(() => {
      let stream = source ? createReadStream(source) : process.stdin;

      return annuaire.collect(type, stream);
    });
  });

cli.parse(process.argv);
