const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { range } = require("lodash");
const faker = require("faker"); // eslint-disable-line node/no-unpublished-require
const { stdoutStream } = require("oleoduc");
const { createReadStream } = require("fs");
const { Annuaire } = require("../../common/model");
const { runScript } = require("../scriptWrapper");
const annuaire = require("./annuaire");

cli
  .command("reset [file]")
  .description("Réinitialise l'annuaire avec les données de la DEPP")
  .action((file) => {
    runScript(async () => {
      let stream = file ? createReadStream(file) : null;

      await annuaire.deleteAll();
      return annuaire.initialize(stream);
    });
  });

cli
  .command("collect")
  .description("Collecte les données contenues dans la source")
  .action(() => {
    runScript(() => {
      return Promise.all(
        ["catalogue", "onisep", "refea", "opcoep", "onisepStructure"].map(async (type) => {
          return { [type]: await annuaire.collect(type) };
        })
      );
    });
  });

cli
  .command("collect <type> [file]")
  .description("Collecte les données contenues dans la source")
  .action((type, file) => {
    runScript(() => {
      let stream = file ? createReadStream(file) : null;

      return annuaire.collect(type, { stream });
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

cli
  .command("dataset")
  .description("Génère un jeu de données")
  .action(() => {
    runScript(async () => {
      let nbElements = 50;
      await Promise.all(
        range(0, nbElements).map((value) => {
          return new Annuaire({
            uai: faker.helpers.replaceSymbols("#######?"),
            siret: faker.helpers.replaceSymbols("#########00015"),
            nom: faker.company.companyName(),
            uais_secondaires: value % 2 ? [{ uai: faker.helpers.replaceSymbols("#######?"), type: "test" }] : [],
          }).save();
        })
      );

      return {
        inserted: nbElements,
      };
    });
  });

cli.parse(process.argv);
