const { program: cli } = require("commander");
const { runScript } = require("../scriptWrapper");
const { createReadStream } = require("fs");
const annuaire = require("./annuaire");

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

cli.parse(process.argv);
