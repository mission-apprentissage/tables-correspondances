const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createApiSireneMock } = require("../../../utils/mocks");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { importReferentiel } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations de l'api Sirene", async () => {
    await importReferentiel();
    let source = await createSource("sirene", { apiSirene: createApiSireneMock() });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(found.siegeSocial, true);
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
      label: "31 rue des lilas Paris 75019",
      numero_voie: "31",
      type_voie: "RUE",
      nom_voie: "DES LILAS",
      code_postal: "75019",
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

  it("Vérifie qu'on gère une erreur lors de la récupération des informations de l'api Sirene", async () => {
    await importReferentiel();
    let failingApi = {
      getUniteLegale: () => {
        throw new Error("HTTP error");
      },
    };
    let source = await createSource("sirene", { apiSirene: failingApi });

    let results = await collect(source);

    let count = await Annuaire.count({ siret: "11111111111111" });
    assert.deepStrictEqual(count, 1);
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 0,
      failed: 1,
    });
  });
});
