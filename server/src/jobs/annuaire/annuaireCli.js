const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { oleoduc, writeToStdout } = require("oleoduc");
const { computeChecksum } = require("../../common/utils/uaiUtils");
const { createReadStream } = require("fs");
const { runScript } = require("../scriptWrapper");
const { createReferentiel } = require("./referentiels/referentiels");
const { createSource } = require("./sources/sources");
const collectSources = require("./tasks/collectSources");
const consolidate = require("./tasks/consolidate");
const etablissementAsCsvStream = require("./tasks/etablissementAsCsvStream");
const etablissementAsJsonStream = require("./tasks/etablissementAsJsonStream");
const clear = require("./clear");
const computeStats = require("./computeStats");
const importReferentiel = require("./importReferentiel");
const build = require("./build");

cli.command("build").action(() => {
  runScript(() => build());
});

cli
  .command("importReferentiel <names> [file]")
  .description("Import les données contenues dans le ou les référentiels")
  .action((names, file) => {
    runScript(async () => {
      let referentielNames = names.split(",");
      let input = file ? createReadStream(file) : null;
      let stats = [];

      let referentiels = referentielNames.map((name) => createReferentiel(name, { input }));
      for (let referentiel of referentiels) {
        let results = await importReferentiel(referentiel);
        stats.push({ [referentiel.name]: results });
      }

      return stats;
    });
  });

cli
  .command("collectSources <names> [file]")
  .option("--siret <siret>", "Limite la collecte pour le siret")
  .description("Parcourt la ou les sources pour trouver des données complémentaires")
  .action((names, file, { siret }) => {
    runScript(() => {
      let sourceNames = names.split(",");
      let input = file ? createReadStream(file) : null;
      let options = siret ? { filters: { siret } } : {};

      let sources = sourceNames.map((name) => createSource(name, { input }));
      return collectSources(sources, options);
    });
  });

cli
  .command("consolidate")
  .description("Consolide les données collectées")
  .action(() => {
    runScript(() => {
      return consolidate();
    });
  });

cli
  .command("export")
  .description("Exporte l'annuaire")
  .option("--filter <filter>", "Filtre au format json", JSON.parse)
  .option("--limit <limit>", "Nombre maximum d'éléments à exporter", parseInt)
  .option("--json", "Exporte les données au format json")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action(({ filter, limit, json, out }) => {
    runScript(() => {
      let options = { filter, limit };
      let input = json ? etablissementAsJsonStream(options) : etablissementAsCsvStream(options);

      return oleoduc(input, out || writeToStdout());
    });
  });

cli
  .command("clear")
  .description("Vide l'annuaire avec les données de la DEPP")
  .action(() => {
    runScript(() => {
      return clear();
    });
  });

cli
  .command("computeStats")
  .option("--save", "Sauvegarde les résultats dans les stats")
  .action((options) => {
    runScript(async () => {
      let sourceNames = ["deca", "catalogue", "sifa-ramsese"];
      let sources = sourceNames.map((name) => createSource(name));
      return computeStats(sources, options);
    });
  });

cli
  .command("uai <code>")
  .description("Génère un uai valide")
  .action((code) => {
    runScript(() => {
      return {
        uai: `${code}${computeChecksum(code)}`.toUpperCase(),
      };
    });
  });

cli.parse(process.argv);
