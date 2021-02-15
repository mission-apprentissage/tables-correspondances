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
    let source = await createSource("sirene", { apiSirene: createApiSireneMock() });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(found.siege_social, true);
    assert.deepStrictEqual(found.statut, "actif");
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

  it("Vérifie qu'on peut collecter des informations sur les relations (établissement)", async () => {
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
    });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        type: "établissement",
        siret: "11111111122222",
        statut: "actif",
        details: "NOMAYO2 75001 PARIS",
        annuaire: false,
      },
    ]);
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut détecter des relations qui existent dans l'annuaire", async () => {
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
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        type: "siege",
        siret: "11111111122222",
        statut: "actif",
        details: "NOMAYO2 75001 PARIS",
        annuaire: true,
      },
    ]);
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des informations de l'API Sirene", async () => {
    await importReferentiel();
    let failingApi = {
      getUniteLegale: () => {
        throw new Error("HTTP error");
      },
    };
    let source = await createSource("sirene", { apiSirene: failingApi });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "HTTP error");
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
    let source = await createSource("sirene", { apiSirene: failingApi });

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
    let source = await createSource("sirene", { apiSirene: failingApi });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "Entreprise inconnue");
  });
});
