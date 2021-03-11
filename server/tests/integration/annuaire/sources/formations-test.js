const assert = require("assert");
const { omit } = require("lodash");
const ApiError = require("../../../../src/common/apis/ApiError");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createApiCatalogueMock, createApiGeoAddresseMock } = require("../../../utils/mocks");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { importReferentiel } = require("../../../utils/testUtils");
const { createAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des relations (formateur)", async () => {
    await importReferentiel();
    let source = await createSource("formations", {
      apiGeoAdresse: createApiGeoAddresseMock(),
      apiCatalogue: createApiCatalogueMock({
        formations: [
          {
            etablissement_gestionnaire_siret: "11111111111111",
            etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
            etablissement_formateur_siret: "22222222222222",
            etablissement_formateur_entreprise_raison_sociale: "Etablissement",
          },
        ],
      }),
    });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        label: "Etablissement",
        annuaire: false,
        type: "formateur",
        source: "formations",
      },
    ]);
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut collecter des relations (gestionnaire)", async () => {
    await importReferentiel();
    let source = await createSource("formations", {
      apiGeoAdresse: createApiGeoAddresseMock(),
      apiCatalogue: createApiCatalogueMock(
        {
          formations: [
            {
              etablissement_gestionnaire_siret: "22222222222222",
              etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
              etablissement_formateur_siret: "11111111111111",
              etablissement_formateur_entreprise_raison_sociale: "Etablissement",
            },
          ],
        },
        { array: "merge" }
      ),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        label: "Entreprise",
        annuaire: false,
        type: "gestionnaire",
        source: "formations",
      },
    ]);
  });

  it("Vérifie qu'on peut collecter des lieux de formation", async () => {
    await importReferentiel();
    let source = await createSource("formations", {
      apiGeoAdresse: createApiGeoAddresseMock(
        {
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [2.396444, 48.879706],
              },
              properties: {
                label: "32 Rue des lilas 75019 Paris",
                score: 0.88,
                name: "32 Rue des Lilas",
                city: "Paris",
              },
            },
          ],
        },
        { array: "merge" }
      ),
      apiCatalogue: createApiCatalogueMock(
        {
          formations: [
            {
              lieu_formation_siret: "33333333333333",
              lieu_formation_geo_coordonnees: "48.879706,2.396444",
            },
          ],
        },
        { array: "merge" }
      ),
    });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();

    assert.deepStrictEqual(found.lieux_de_formation[0], {
      siret: "33333333333333",
      adresse: {
        label: "32 Rue des lilas 75019 Paris",
        code_postal: "75019",
        code_insee: "75119",
        localite: "Paris",
        geojson: {
          type: "Feature",
          geometry: { coordinates: [2.396444, 48.879706], type: "Point" },
          properties: { score: 0.88 },
        },
      },
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut collecter des lieux de formation", async () => {
    await importReferentiel();
    let source = await createSource("formations", {
      apiGeoAdresse: {
        reverse() {
          throw new Error("reverse failed");
        },
      },
      apiCatalogue: createApiCatalogueMock(),
    });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();

    assert.strictEqual(found.lieux_de_formation.length, 0);
    assert.strictEqual(found._meta.anomalies.length, 2);
    assert.deepStrictEqual(omit(found._meta.anomalies[0], ["date"]), {
      type: "collect",
      source: "formations",
      details: "reverse failed",
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 1,
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await createAnnuaire({
      siret: "11111111100000",
    });
    let source = await createSource("academie", { apiCatalogue: createApiCatalogueMock() });

    let results = await collect(source, { filters: { siret: "33333333333333" } });

    assert.deepStrictEqual(results, {
      total: 0,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut détecter des relations avec des établissements déjà dans l'annuaire", async () => {
    await importReferentiel();
    await createAnnuaire({ siret: "22222222222222", raison_sociale: "Mon centre de formation" });
    let source = await createSource("formations", {
      apiGeoAdresse: createApiGeoAddresseMock(),
      apiCatalogue: createApiCatalogueMock({
        formations: [
          {
            etablissement_gestionnaire_siret: "11111111111111",
            etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
            etablissement_formateur_siret: "22222222222222",
            etablissement_formateur_entreprise_raison_sociale: "Etablissement",
          },
        ],
      }),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(found.relations[0].annuaire, true);
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des formations", async () => {
    await importReferentiel();
    let failingApi = {
      getFormations: () => {
        throw new ApiError("api", "HTTP error");
      },
    };
    let source = await createSource("formations", { apiCatalogue: failingApi });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "[api] HTTP error");
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 0,
      failed: 1,
    });
  });
});
