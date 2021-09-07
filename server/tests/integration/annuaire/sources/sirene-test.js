const assert = require("assert");
const { omit } = require("lodash");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/tasks/collectSources");
const { importReferentiel } = require("../../../utils/testUtils");
const { getMockedApiSirene, getMockedApiGeoAddresse } = require("../../../utils/apiMocks");

function createSireneSource(custom = {}) {
  return createSource("sirene", {
    apiGeoAdresse: getMockedApiGeoAddresse((mock, responses) => {
      mock.onGet(/reverse.*/).reply(200, responses.reverse());
    }),
    apiSirene: getMockedApiSirene((mock, responses) => {
      mock.onGet("unites_legales/111111111").reply(200, responses.unitesLegales());
      mock.onGet("etablissements/11111111100006").reply(200, responses.etablissement());
    }),
    organismes: ["11111111100006"],
    ...custom,
  });
}

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations de l'API Sirene", async () => {
    await importReferentiel();
    let source = createSireneSource();

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.raison_sociale, "NOMAYO");
    assert.strictEqual(found.siege_social, true);
    assert.strictEqual(found.statut, "actif");
    assert.deepStrictEqual(found.forme_juridique, { code: "5710", label: "SAS, société par actions simplifiée" });
    assert.deepStrictEqual(found.adresse, {
      geojson: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [2.396444, 48.879706],
        },
        properties: {
          score: 0.88,
        },
      },
      label: "31 Rue des lilas 75019 Paris",
      code_postal: "75019",
      code_insee: "75119",
      localite: "Paris",
      region: {
        code: "11",
        nom: "Île-de-France",
      },
      academie: {
        code: "01",
        nom: "Paris",
      },
    });
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on recherche une adresse quand ne peut pas reverse-geocoder", async () => {
    await importReferentiel();
    let source = createSireneSource({
      apiGeoAdresse: getMockedApiGeoAddresse((mock, responses) => {
        mock.onGet(/reverse.*/).reply(400, {});
        mock.onGet(/search.*/).reply(200, responses.search());
      }),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.adresse, {
      geojson: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [2.396444, 48.879706],
        },
        properties: {
          score: 0.88,
        },
      },
      label: "31 Rue des lilas 75019 Paris",
      code_postal: "75019",
      code_insee: "75119",
      localite: "Paris",
      region: {
        code: "11",
        nom: "Île-de-France",
      },
      academie: {
        code: "01",
        nom: "Paris",
      },
    });
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des relations", async () => {
    await importReferentiel();
    let api = getMockedApiSirene((mock, responses) => {
      mock.onGet("etablissements/11111111100006").reply(200, responses.etablissement());
      mock.onGet("unites_legales/111111111").reply(
        200,
        responses.unitesLegales({
          unite_legale: {
            etablissements: [
              {
                siret: "11111111100006",
                etat_administratif: "A",
                etablissement_siege: "true",
                libelle_voie: "DES LILAS",
                code_postal: "75019",
                libelle_commune: "PARIS",
              },
              {
                siret: "11111111122222",
                denomination_usuelle: "NOMAYO2",
                etat_administratif: "A",
                etablissement_siege: "false",
                libelle_voie: "DES LILAS",
                code_postal: "75001",
                libelle_commune: "PARIS",
              },
            ],
          },
        })
      );
    });
    let source = createSireneSource({
      apiSirene: api,
      organismes: ["11111111100006", "11111111122222"],
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "11111111122222",
        label: "NOMAYO2 75001 PARIS",
        annuaire: false,
        sources: ["sirene"],
      },
    ]);
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await importReferentiel(`"siren";"num_etablissement";"cfa"
"111111111";"00006";"Oui"`);

    let source = createSireneSource({
      organismes: ["11111111100006"],
    });

    let stats = await collectSources(source, { filters: { siret: "33333333300008" } });

    assert.deepStrictEqual(stats, {
      sirene: {
        total: 0,
        updated: 0,
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on ignore les relations qui ne sont pas des organismes de formations", async () => {
    await importReferentiel(`"siren";"num_etablissement";"cfa"
"111111111";"00006";"Oui"`);
    let api = getMockedApiSirene((mock, responses) => {
      mock.onGet("etablissements/11111111100006").reply(200, responses.etablissement());
      mock.onGet("unites_legales/111111111").reply(
        200,
        responses.unitesLegales({
          unite_legale: {
            etablissements: [
              {
                siret: "11111111100006",
                etat_administratif: "A",
                etablissement_siege: "true",
                libelle_voie: "DES LILAS",
                code_postal: "75019",
                libelle_commune: "PARIS",
              },
              {
                siret: "2222222222222222",
                etat_administratif: "A",
                etablissement_siege: "true",
                libelle_voie: "DES LILAS",
                code_postal: "75019",
                libelle_commune: "PARIS",
              },
            ],
          },
        })
      );
    });

    let source = createSireneSource({
      apiSirene: api,
      organismes: ["2222222222222222"],
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.relations.length, 1);
    assert.deepStrictEqual(found.relations[0].siret, "2222222222222222");
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on ignore les relations pour des établissements fermés", async () => {
    await importReferentiel();
    let api = getMockedApiSirene((mock, responses) => {
      mock.onGet("etablissements/11111111100006").reply(200, responses.etablissement());
      mock.onGet("unites_legales/111111111").reply(
        200,
        responses.unitesLegales({
          unite_legale: {
            etablissements: [
              {
                siret: "11111111100006",
                etat_administratif: "A",
                etablissement_siege: "true",
                libelle_voie: "DES LILAS",
                code_postal: "75019",
                libelle_commune: "PARIS",
              },
              {
                siret: "11111111122222",
                denomination_usuelle: "NOMAYO2",
                etat_administratif: "F",
                etablissement_siege: "false",
                libelle_voie: "DES LILAS",
                code_postal: "75001",
                libelle_commune: "PARIS",
              },
            ],
          },
        })
      );
    });

    let source = createSireneSource({
      apiSirene: api,
      organismes: ["11111111100006", "11111111122222"],
    });

    await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.relations, []);
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des informations de l'API Sirene", async () => {
    await importReferentiel();
    let source = createSireneSource({
      apiSirene: getMockedApiSirene((mock) => {
        mock.onGet(/unites_legales.*/).reply(500, {});
      }),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "[Api Sirene] Request failed with status code 500");
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 0,
        ignored: 0,
        failed: 1,
      },
    });
  });

  it("Vérifie qu'on gère une erreur spécifique quand l'établissement n'existe pas", async () => {
    await importReferentiel();
    let source = createSireneSource({
      apiSirene: getMockedApiSirene((mock) => {
        mock.onGet(/unites_legales.*/).reply(200, { unite_legale: { etablissements: [] } });
      }),
    });

    await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "Etablissement inconnu pour l'entreprise 111111111");
  });

  it("Vérifie qu'on gère une erreur spécifique quand l'entreprise n'existe pas", async () => {
    await importReferentiel();
    let source = createSireneSource({
      apiSirene: getMockedApiSirene((mock) => {
        mock.onGet(/unites_legales.*/).reply(404, {});
      }),
    });

    await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "Entreprise inconnue");
  });

  it("Vérifie qu'on crée une anomalie quand on ne peut pas trouver l'adresse", async () => {
    await importReferentiel();
    let source = createSireneSource({
      apiGeoAdresse: {
        search() {
          return Promise.reject(new Error());
        },
        reverse() {
          return Promise.reject(new Error());
        },
      },
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found._meta.anomalies.length, 1);
    assert.deepStrictEqual(omit(found._meta.anomalies[0], ["date"]), {
      job: "collect",
      source: "sirene",
      code: "etablissement_geoloc_impossible",
      details:
        "Impossible de géolocaliser l'adresse de l'établissement: 31 rue des lilas Paris 75001. " +
        "Adresse inconnue [2.396147,48.880391]",
    });
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 1,
      },
    });
  });

  it("Vérifie qu'on crée une anomalie quand on ne peut pas trouver la catégorie juridique", async () => {
    await importReferentiel();
    let source = createSireneSource({
      apiSirene: getMockedApiSirene((mock, responses) => {
        mock.onGet("etablissements/11111111100006").reply(200, responses.etablissement());
        mock
          .onGet(/unites_legales.*/)
          .reply(200, responses.unitesLegales({ unite_legale: { categorie_juridique: "INVALID" } }));
      }),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found._meta.anomalies.length, 1);
    assert.deepStrictEqual(omit(found._meta.anomalies[0], ["date"]), {
      job: "collect",
      source: "sirene",
      code: "categorie_juridique_inconnue",
      details: "Impossible de trouver la catégorie juridique de l'entreprise : INVALID",
    });
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 1,
      },
    });
  });
});
