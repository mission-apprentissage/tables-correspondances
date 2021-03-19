const { program: cli } = require("commander");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { createWriteStream } = require("fs");
const { writeToStdout } = require("oleoduc");
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
  .command("collect [name] [file]")
  .option("--siret <siret>", "Limite la collecte pour le siret")
  .description("Parcoure la ou les sources pour trouver des données complémentaires")
  .action((name, file, { siret }) => {
    runScript(async () => {
      let options = siret ? { filters: { siret } } : {};

      if (name) {
        let input = file ? createReadStream(file) : null;
        let source = await createSource(name, { input });
        return collect(source, options);
      } else {
        let groups = getDefaultSourcesGroupedByPriority();
        let stats = [];

        for (let group of groups) {
          let sources = await Promise.all(group.map(createSource));
          let results = await collect(sources, options);
          stats.push(results);
        }

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
      let output = out || writeToStdout();

      return exportAnnuaire(output, { filter, limit, format });
    });
  });

cli.parse(process.argv);
