const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { oleoduc, writeToStdout } = require("oleoduc");
const { computeChecksum } = require("../../common/utils/uaiUtils");
const ApiGeoAdresse = require("../../common/apis/ApiGeoAdresse");
const { createReadStream } = require("fs");
const { runScript } = require("../scriptWrapper");
const { createReferentiel, getDefaultReferentiels } = require("./referentiels/referentiels");
const { createSource, getDefaultSourcesGroupedByPriority } = require("./sources/sources");
const importReferentiel = require("./importReferentiel");
const collectSources = require("./collectSources");
const clearAnnuaire = require("./clearAnnuaire");
const etablissementAsCsvStream = require("./utils/etablissementAsCsvStream");
const etablissementAsJsonStream = require("./utils/etablissementAsJsonStream");
const computeStats = require("./computeStats");
const consolidate = require("./consolidate");

cli
  .command("computeStats")
  .option("--save", "Sauvegarde les résultats dans les stats")
  .action((options) => {
    runScript(async () => {
      let sourceNames = ["deca", "catalogue", "sifa-ramsese"];
      let sources = await Promise.all(sourceNames.map((name) => createSource(name)));
      return computeStats(sources, options);
    });
  });

cli
  .command("importReferentiel [name] [file]")
  .description("Import les données contenues dans le ou les référentiels")
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
  .command("collectSources [name] [file]")
  .option("--siret <siret>", "Limite la collecte pour le siret")
  .description("Parcoure la ou les sources pour trouver des données complémentaires")
  .action((name, file, { siret }) => {
    runScript(async () => {
      let input = file ? createReadStream(file) : null;
      let options = siret ? { filters: { siret } } : {};
      let groups = name ? [[name]] : getDefaultSourcesGroupedByPriority();
      let stats = [];

      for (let group of groups) {
        let sources = await Promise.all(
          group.map((name) => {
            return createSource(name, { input, apiGeoAdresse: new ApiGeoAdresse() });
          })
        );
        let results = await collectSources(sources, options);
        stats.push(results);
      }

      return stats;
    });
  });

cli
  .command("consolidate")
  .description("Corrige les données qui viennent d'être collectées")
  .action(() => {
    runScript(async () => {
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
      return clearAnnuaire();
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
