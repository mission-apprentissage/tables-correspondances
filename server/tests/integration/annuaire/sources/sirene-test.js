const assert = require("assert");
const ApiError = require("../../../../src/common/apis/ApiError");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createApiSireneMock } = require("../../../utils/mocks");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { importReferentiel } = require("../../../utils/testUtils");
const { createAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations de l'API Sirene", async () => {
    await importReferentiel();
    let source = await createSource("sirene", { apiSirene: createApiSireneMock(), organismes: ["11111111111111"] });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(found.raison_sociale, "NOMAYO");
    assert.strictEqual(found.siege_social, true);
    assert.strictEqual(found.statut, "actif");
    assert.deepStrictEqual(found.adresse, {
      geojson: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [2.396147, 48.880391],
        },
        properties: {
          score: 0.88,
        },
      },
      label: "31 rue des lilas Paris 75001",
      numero_voie: "31",
      type_voie: "RUE",
      nom_voie: "DES LILAS",
      code_postal: "75001",
      code_insee: "75000",
      localite: "PARIS",
      cedex: null,
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
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

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "11111111122222",
        label: "NOMAYO2 75001 PARIS",
        annuaire: false,
        sources: ["sirene"],
      },
    ]);
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"11111111111111"`);

    let source = await createSource("sirene", {
      apiSirene: createApiSireneMock(),
      organismes: ["11111111111111"],
    });

    let results = await collect(source, { filters: { siret: "33333333333333" } });

    assert.deepStrictEqual(results, {
      total: 0,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on ignore les relations qui ne sont pas des organismes de formations", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"11111111111111"`);
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

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(found.relations.length, 1);
    assert.deepStrictEqual(found.relations[0].siret, "2222222222222222");
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on ignore les relations pour des établissements fermés", async () => {
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

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, []);
  });

  it("Vérifie qu'on peut détecter des relations entre établissements de l'annuaire", async () => {
    await importReferentiel();
    await createAnnuaire({ siret: "11111111122222" });
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
            etablissement_siege: "true",
            code_postal: "75001",
            libelle_commune: "PARIS",
          },
        ],
      }),
      organismes: ["11111111111111", "11111111122222"],
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "11111111122222",
        label: "NOMAYO2 75001 PARIS",
        annuaire: true,
        sources: ["sirene"],
      },
    ]);
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des informations de l'API Sirene", async () => {
    await importReferentiel();
    let failingApi = {
      getUniteLegale: () => {
        throw new ApiError("api", "HTTP error");
      },
    };
    let source = await createSource("sirene", { apiSirene: failingApi, organismes: ["11111111111111"] });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "[api] HTTP error");
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 0,
      failed: 1,
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
});
