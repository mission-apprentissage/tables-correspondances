const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { oleoduc, writeToStdout } = require("oleoduc");
const { createReadStream } = require("fs");
const { runScript } = require("../scriptWrapper");
const { createReferentiel, getDefaultReferentiels } = require("./referentiels/referentiels");
const { createSource, getDefaultSourcesGroupedByPriority } = require("./sources/sources");
const cleanAll = require("./cleanAll");
const importReferentiel = require("./importReferentiel");
const collect = require("./collect");
const etablissementAsCsvStream = require("./utils/etablissementAsCsvStream");

cli
  .command("clean")
  .description("Vide l'annuaire avec les données de la DEPP")
  .action(() => {
    runScript(() => {
      return cleanAll();
    });
  });

cli
  .command("import [name] [file]")
  .description("Importe les établissements contenus dans le ou les référentiels")
  .action((name, file) => {
    runScript(async () => {
      let input = file ? createReadStream(file) : null;
      let referentiels = name ? [name] : await getDefaultReferentiels();
      let stats = [];

      for (let name of referentiels) {
        let referentiel = await createReferentiel(name, { input });
        let results = await importReferentiel(referentiel);
        stats.push({ [referentiel.name]: results });
      }

      return stats;
    });
  });

cli
  .command("collect [name] [file]")
  .option("--siret <siret>", "Limite la collecte pour le siret")
  .description("Parcoure la ou les sources pour trouver des données complémentaires")
  .action((name, file, { siret }) => {
    runScript(async () => {
      let input = file ? createReadStream(file) : null;
      let options = siret ? { filters: { siret } } : {};
      let groups = name ? [[name]] : getDefaultSourcesGroupedByPriority();
      let stats = [];

      for (let group of groups) {
        let sources = await Promise.all(group.map((name) => createSource(name, { input })));
        let results = await collect(sources, options);
        stats.push(results);
      }

      return stats;
    });
  });

cli
  .command("export")
  .description("Exporte l'annuaire")
  .option("--filter <filter>", "Filtre au format json", JSON.parse)
  .option("--limit <limit>", "Nombre maximum d'éléments à exporter", parseInt)
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action(({ filter, limit, out }) => {
    runScript(() => {
      let input = etablissementAsCsvStream({ filter, limit });

      return oleoduc(input, out || writeToStdout());
    });
  });

cli.parse(process.argv);
