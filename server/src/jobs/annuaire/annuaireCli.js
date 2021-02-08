const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { stdoutStream } = require("oleoduc");
const { createReadStream } = require("fs");
const { runScript } = require("../scriptWrapper");
const { createSource, getDefaultSources } = require("./sources/sources");
const { createReferentiel, getDefaultReferentiels } = require("./referentiels/referentiels");
const cleanAll = require("./cleanAll");
const importReferentiel = require("./importReferentiel");
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
          return {
            [referentiel.type]: await importReferentiel(referentiel),
          };
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
        sources.push(await createSource(type, stream));
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

cli.parse(process.argv);
