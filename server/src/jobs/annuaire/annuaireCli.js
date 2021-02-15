const { program: cli } = require("commander");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { createWriteStream } = require("fs");
const { stdoutStream } = require("oleoduc");
const { createReadStream } = require("fs");
const { runScript } = require("../scriptWrapper");
const { createSource, getSourcesChunks } = require("./sources/sources");
const { createReferentiel, getReferentiels } = require("./referentiels/referentiels");
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
      if (type) {
        let stream = file ? createReadStream(file) : undefined;
        let referentiel = createReferentiel(type, stream);
        return importReferentiel(referentiel);
      } else {
        let referentiels = await getReferentiels();
        let stats = {};
        await asyncForEach(referentiels, async (builder) => {
          //Handle each referentiel sequentially
          let referentiel = await builder();
          stats = {
            ...stats,
            [referentiel.type]: await collect(referentiel),
          };
        });
        return stats;
      }
    });
  });

cli
  .command("collect [type] [file]")
  .description("Parcoure la ou les sources pour trouver des données complémentaires")
  .action((type, file) => {
    runScript(async () => {
      if (type) {
        let stream = file ? createReadStream(file) : undefined;
        let source = await createSource(type, stream);
        return collect(source);
      } else {
        let chunks = getSourcesChunks();

        let stats = {};
        await asyncForEach(chunks, (array) => {
          return Promise.all(
            array.map(async (builder) => {
              let source = await builder();
              stats = {
                ...stats,
                [source.type]: await collect(source),
              };
            })
          );
        });
        return stats;
      }
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
