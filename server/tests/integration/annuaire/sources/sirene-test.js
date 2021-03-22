const assert = require("assert");
const { omit } = require("lodash");
const ApiError = require("../../../../src/common/apis/ApiError");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createApiSireneMock, createApiGeoAddresseMock } = require("../../../utils/mocks");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { importReferentiel } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations de l'API Sirene", async () => {
    await importReferentiel();
    let source = await createSource("sirene", {
      apiGeoAdresse: createApiGeoAddresseMock(),
      apiSirene: createApiSireneMock(),
      organismes: ["11111111111111"],
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
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
        label: "Île-de-France",
      },
    });
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on recherche une adresse quand ne peut pas reverse-geocoder", async () => {
    await importReferentiel();
    let source = await createSource("sirene", {
      apiGeoAdresse: {
        search() {
          return Promise.resolve(createApiGeoAddresseMock().search());
        },
        reverse() {
          return Promise.reject(new Error());
        },
      },
      apiSirene: createApiSireneMock(),
      organismes: ["11111111111111"],
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
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
        label: "Île-de-France",
      },
    });
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des relations", async () => {
    await importReferentiel();
    let source = await createSource("sirene", {
      apiSirene: createApiSireneMock({
        etablissements: [
          {
            siret: "11111111111111",
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
      }),
      organismes: ["11111111111111", "11111111122222"],
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "11111111122222",
        label: "NOMAYO2 75001 PARIS",
        annuaire: false,
        source: "sirene",
      },
    ]);
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"11111111111111"`);

    let source = await createSource("sirene", {
      apiSirene: createApiSireneMock(),
      organismes: ["11111111111111"],
    });

    let stats = await collect(source, { filters: { siret: "33333333333333" } });

    assert.deepStrictEqual(stats, {
      sirene: {
        total: 0,
        updated: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on ignore les relations qui ne sont pas des organismes de formations", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"11111111111111"`);
    let source = await createSource("sirene", {
      apiGeoAdresse: createApiGeoAddresseMock(),
      apiSirene: createApiSireneMock({
        etablissements: [
          {
            siret: "11111111111111",
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
      }),
      organismes: ["2222222222222222"],
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.strictEqual(found.relations.length, 1);
    assert.deepStrictEqual(found.relations[0].siret, "2222222222222222");
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on ignore les relations pour des établissements fermés", async () => {
    await importReferentiel();
    let source = await createSource("sirene", {
      apiGeoAdresse: createApiGeoAddresseMock(),
      apiSirene: createApiSireneMock({
        etablissements: [
          {
            siret: "11111111111111",
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
      }),
      organismes: ["11111111111111", "11111111122222"],
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.relations, []);
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des informations de l'API Sirene", async () => {
    await importReferentiel();
    let failingApi = {
      getUniteLegale: () => {
        throw new ApiError("api", "HTTP error");
      },
    };
    let source = await createSource("sirene", { apiSirene: failingApi, organismes: ["11111111111111"] });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "[api] HTTP error");
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 0,
        failed: 1,
      },
    });
  });

  it("Vérifie qu'on gère une erreur spécifique quand l'établissement n'existe pas", async () => {
    await importReferentiel();
    let failingApi = {
      getUniteLegale: () => {
        return {
          etablissements: [],
        };
      },
    };
    let source = await createSource("sirene", { apiSirene: failingApi, organismes: ["11111111111111"] });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "Etablissement inconnu pour l'entreprise 111111111");
  });

  it("Vérifie qu'on gère une erreur spécifique quand l'entreprise n'existe pas", async () => {
    await importReferentiel();
    let failingApi = {
      getUniteLegale: () => {
        throw new ApiError("sirene", "mocked", 404);
      },
    };
    let source = await createSource("sirene", { apiSirene: failingApi, organismes: ["11111111111111"] });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "Entreprise inconnue");
  });

  it("Vérifie qu'on créer une anomalie quand on ne peut pas trouver l'adresse", async () => {
    await importReferentiel();
    let source = await createSource("sirene", {
      apiGeoAdresse: {
        search() {
          return Promise.reject(new Error());
        },
        reverse() {
          return Promise.reject(new Error());
        },
      },
      apiSirene: createApiSireneMock(),
      organismes: ["11111111111111"],
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.strictEqual(found._meta.anomalies.length, 1);
    assert.deepStrictEqual(omit(found._meta.anomalies[0], ["date"]), {
      task: "collect",
      source: "sirene",
      details: "Adresse inconnue pour les coordonnées latitude:2.396147 et longitude:48.880391",
    });
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        failed: 1,
      },
    });
  });

  it("Vérifie qu'on crée une anomalie quand on ne peut pas trouver la catégorie juridique", async () => {
    await importReferentiel();
    let source = await createSource("sirene", {
      apiGeoAdresse: createApiGeoAddresseMock(),
      apiSirene: createApiSireneMock({
        categorie_juridique: "INVALID",
      }),
      organismes: ["11111111111111"],
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.strictEqual(found._meta.anomalies.length, 1);
    assert.deepStrictEqual(omit(found._meta.anomalies[0], ["date"]), {
      task: "collect",
      source: "sirene",
      details: "Impossible de trouver la catégorie juridique",
    });
    assert.deepStrictEqual(stats, {
      sirene: {
        total: 1,
        updated: 1,
        failed: 1,
      },
    });
  });
});
