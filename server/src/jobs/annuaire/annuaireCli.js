const { program: cli } = require("commander");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { createWriteStream } = require("fs");
const { stdoutStream } = require("oleoduc");
const { createReadStream } = require("fs");
const { runScript } = require("../scriptWrapper");
const { createReferentiel, getDefaultReferentiels } = require("./referentiels/referentiels");
const { createSource, getDefaultSourcesGroupedByPriority } = require("./sources/sources");
const cleanAll = require("./cleanAll");
const importReferentiel = require("./importReferentiel");
const collect = require("./collect");
const { exportAnnuaire } = require("./exports");

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
        let input = file ? createReadStream(file) : process.stdin;
        let referentiel = await createReferentiel(type, { input });
        return importReferentiel(referentiel);
      } else {
        let referentiels = await getDefaultReferentiels();
        let stats = [];

        await asyncForEach(referentiels, async (builder) => {
          //Handle each referentiel sequentially
          let referentiel = await builder();
          let res = { [referentiel.type]: await importReferentiel(referentiel) };
          stats.push(res);
        });

        return stats;
      }
    });
  });

cli
  .command("collect [type] [file]")
  .option("--siret <siret>", "Limite la collecte pour le siret")
  .description("Parcoure la ou les sources pour trouver des données complémentaires")
  .action((type, file, { siret }) => {
    runScript(async () => {
      let options = siret ? { filters: { siret } } : {};

      if (type) {
        let input = file ? createReadStream(file) : process.stdin;
        let source = await createSource(type, { ...options, input });
        return collect(source);
      } else {
        let groups = getDefaultSourcesGroupedByPriority();
        let stats = [];

        await asyncForEach(groups, async (group) => {
          let promises = group.map(async (builder) => {
            let source = await builder(options);
            return { [source.type]: await collect(source) };
          });

          let results = await Promise.all(promises);
          stats.push(results);
        });

        return stats;
      }
    });
  });

cli
  .command("export")
  .description("Exporte l'annuaire")
  .option("--filter <filter>", "Filtre au format json", JSON.parse)
  .option("--limit <limit>", "Nombre maximum d'éléments à exporter", parseInt)
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .option("--format <format>", "Format : json|csv(défaut)")
  .action(({ filter, limit, out, format }) => {
    runScript(() => {
      let output = out || stdoutStream();

      return exportAnnuaire(output, { filter, limit, format });
    });
  });

cli.parse(process.argv);
