const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { range } = require("lodash");
const faker = require("faker"); // eslint-disable-line node/no-unpublished-require
const { stdoutStream } = require("oleoduc");
const { createReadStream } = require("fs");
const logger = require("../../common/logger");
const { Annuaire } = require("../../common/model");
const { runScript } = require("../scriptWrapper");
const annuaire = require("./annuaire");
const ovhStorage = require("../../common/ovhStorage");
const { createSource } = require("./sources/sources");

const getOVHFileAsStream = (filename) => {
  let file = `/mna-tables-correspondances/annuaire/${filename}`;
  logger.info(`Downloading ${file} from OVH...`);
  return ovhStorage.getFileAsStream(file);
};

const getDefaultsUAIsRessources = () => {
  return Promise.all(
    [
      { type: "catalogue" },
      { type: "onisep", file: "ONISEP-ideo-structures_denseignement_secondaire.csv" },
      { type: "onisep", file: "ONISEP-ideo-structures_denseignement_superieur.csv" },
      { type: "onisepStructure", file: "ONISEP-Structures.csv" },
      { type: "refea", file: "REFEA-liste-uai-avec-coordonnees.csv" },
      {
        type: "opcoep",
        file: "OPCO EP-20201202 OPCO EP - Jeunes sans contrat par CFA, région et formation au 26 nov.csv",
      },
    ].map(async ({ type, file }) => {
      return {
        type: type,
        stream: file && (await getOVHFileAsStream(file)),
      };
    })
  );
};

cli
  .command("reset [file]")
  .description("Réinitialise l'annuaire avec les données de la DEPP")
  .action((file) => {
    runScript(async () => {
      let stream = file ? createReadStream(file) : await getOVHFileAsStream("DEPP-CFASousConvRegionale_17122020_1.csv");

      await annuaire.deleteAll();
      return annuaire.initialize(stream);
    });
  });

cli
  .command("collect [type] [file]")
  .description("Parcoure la ou les sources pour trouver des uais secondaires")
  .action((type, file) => {
    runScript(async () => {
      let collectable = type
        ? [{ type, stream: file ? createReadStream(file) : null }]
        : await getDefaultsUAIsRessources();

      return Promise.all(
        collectable.map(async ({ type, stream }) => {
          let source = createSource(type, stream);
          return { [type]: await annuaire.collect(source) };
        })
      );
    });
  });

let exporter = cli.command("export");
exporter
  .command("all")
  .description("Exporte l'annuaire")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .option("--format <format>", "Format : json|csv(défaut)")
  .action(({ out, format }) => {
    runScript(() => {
      let output = out || stdoutStream();

      return annuaire.export(output, { format });
    });
  });

exporter
  .command("manquants")
  .description("Exporte les établissements de l'annuaire qui ne sont pas dans le catalogue")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .option("--format <format>", "Format : json|csv(défaut)")
  .action(({ out, format }) => {
    runScript(() => {
      let output = out || stdoutStream();
      return annuaire.exportManquants(output, { format });
    });
  });

cli
  .command("dataset")
  .description("Génère un jeu de données")
  .action(() => {
    runScript(async () => {
      let nbElements = 50;
      // TODO reuse fixture
      await Promise.all(
        range(0, nbElements).map((value) => {
          return new Annuaire({
            uai: faker.helpers.replaceSymbols("#######?"),
            siret: faker.helpers.replaceSymbols("#########00015"),
            nom: faker.company.companyName(),
            uais_secondaires: value % 2 ? [{ uai: faker.helpers.replaceSymbols("#######?"), type: "test" }] : [],
            region: "11",
            siegeSocial: true,
            dateCreation: new Date("2020-11-26T23:00:00.000Z"),
            statut: "actif",
          }).save();
        })
      );

      return {
        inserted: nbElements,
      };
    });
  });

cli.parse(process.argv);
