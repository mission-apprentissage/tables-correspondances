const { program: cli } = require("commander");
const { createWriteStream } = require("fs");
const { oleoduc, writeToStdout } = require("oleoduc");
const { computeChecksum } = require("../../common/utils/uaiUtils");
const ApiGeoAdresse = require("../../common/apis/ApiGeoAdresse");
const { createReadStream } = require("fs");
const { runScript } = require("../scriptWrapper");
const { createReferentiel, getDefaultReferentiels } = require("./referentiels/referentiels");
const { createSource, getDefaultSourcesGroupedByPriority, getSourcesToValidate } = require("./sources/sources");
const clearAnnuaire = require("./clearAnnuaire");
const importReferentiel = require("./importReferentiel");
const collectSources = require("./collectSources");
const validateSources = require("./validateSources");
const etablissementAsCsvStream = require("./utils/etablissementAsCsvStream");
const computeStats = require("./computeStats");
const buildMatrice = require("./buildMatrice");

cli
  .command("clear")
  .description("Vide l'annuaire avec les données de la DEPP")
  .action(() => {
    runScript(() => {
      return clearAnnuaire();
    });
  });

cli.command("matrix", "Commandes pour manipuler la matrice des bases", { executableFile: "./matrix/matrixCli.js" });

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

cli
  .command("validateSources [name]")
  .description("Valide les sources de données")
  .action((name) => {
    runScript(async () => {
      let sourceNames = name ? [name] : getSourcesToValidate();
      let sources = await Promise.all(sourceNames.map((name) => createSource(name)));
      return validateSources(sources);
    });
  });

cli
  .command("buildMatrice [name]")
  .description("Permet de construire la matrice")
  .action((name) => {
    runScript(async () => {
      let sourceNames = name ? [name] : getSourcesToValidate();
      let sources = await Promise.all(sourceNames.map((name) => createSource(name)));
      return buildMatrice(sources, ["siret"]);
    });
  });

cli
  .command("computeStats")
  .description("Génère les statistiques de l'annuaire")
  .action(() => {
    runScript(async () => {
      let sources = await Promise.all(getSourcesToValidate().map((name) => createSource(name)));
      return computeStats(sources);
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
