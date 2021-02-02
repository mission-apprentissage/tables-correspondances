const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { range } = require("lodash");
const faker = require("faker"); // eslint-disable-line node/no-unpublished-require
const { stdoutStream } = require("oleoduc");
const { createReadStream } = require("fs");
const { runScript } = require("../scriptWrapper");
const { Annuaire } = require("../../common/model");
const { createSource, getDefaultSources } = require("./sources/sources");
const { createReferentiel, getDefaultReferentiels } = require("./referentiels/referentiels");
const cleanAll = require("./cleanAll");
const importEtablissements = require("./importEtablissements");
const collect = require("./collect");
const { exportAll } = require("./exports");

cli
  .command("clean")
  .description("Vide l'annuaire avec les données de la DEPP")
  .action(() => {
    runScript(() => {
      return cleanAll();
    });
  });

cli
  .command("import [type] [file]")
  .description("Importe les établissements contenus dans le ou les référentiels")
  .action((type, file) => {
    runScript(async () => {
      let referentiels = [];
      if (type) {
        let stream = file ? createReadStream(file) : null;
        referentiels.push(createReferentiel(type, stream));
      } else {
        referentiels = await getDefaultReferentiels();
      }

      return Promise.all(
        referentiels.map(async (referentiel) => {
          return { [referentiel.type]: await importEtablissements(referentiel) };
        })
      );
    });
  });

cli
  .command("collect [type] [file]")
  .description("Parcoure la ou les sources pour trouver des données complémentaires")
  .action((type, file) => {
    runScript(async () => {
      let sources = [];
      if (type) {
        let stream = file ? createReadStream(file) : null;
        sources.push(createSource(type, stream));
      } else {
        sources = await getDefaultSources();
      }

      return Promise.all(
        sources.map(async (source) => {
          return { [source.type]: await collect(source) };
        })
      );
    });
  });

cli
  .command("export")
  .command("all")
  .description("Exporte l'annuaire")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .option("--format <format>", "Format : json|csv(défaut)")
  .action(({ out, format }) => {
    runScript(() => {
      let output = out || stdoutStream();

      return exportAll(output, { format });
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
