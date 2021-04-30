const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { insertAnnuaire } = require("../../../utils/fixtures");
const { getMockedApiEsSup } = require("../../../utils/apiMocks");

function createAcademieSource(custom = {}) {
  return createSource("academie", {
    apiEsSup: getMockedApiEsSup((mock, responses) => {
      mock.onGet(new RegExp(".*")).reply(200, responses.search());
    }),
    ...custom,
  });
}

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations de l'académie", async () => {
    await insertAnnuaire({
      siret: "11111111100000",
      adresse: {
        code_insee: "75000",
      },
    });
    let source = await createAcademieSource();

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111100000" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.academie, {
      code: "01",
      nom: "Paris",
    });
    assert.deepStrictEqual(stats, {
      academie: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await insertAnnuaire({
      siret: "11111111100000",
    });
    let source = await createAcademieSource();

    let stats = await collect(source, { filters: { siret: "33333333333333" } });

    assert.deepStrictEqual(stats, {
      academie: {
        total: 0,
        updated: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on ignore les établissements sans adresse", async () => {
    await insertAnnuaire({
      siret: "11111111100000",
      adresse: null,
    });
    let source = await createAcademieSource();

    let stats = await collect(source);

    assert.deepStrictEqual(stats, {
      academie: {
        total: 0,
        updated: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on gère une anomalie quand on ne peut pas collecter d'informations", async () => {
    await insertAnnuaire({
      siret: "11111111100000",
      adresse: {
        code_insee: "75000",
      },
    });
    let api = getMockedApiEsSup((mock) => {
      mock.onGet(new RegExp(".*")).reply(429, {});
    });

    let source = await createAcademieSource({ apiEsSup: api });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111100000" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "[Api EsSup] Request failed with status code 429");
  });

  it("Vérifie qu'on gère une anomalie quand la réponse est vide", async () => {
    await insertAnnuaire({
      siret: "11111111100000",
      adresse: {
        code_insee: "75000",
      },
    });
    let failingApi = {
      fetchInfoFromCodeCommune: () => {
        return {
          nhits: 0,
          parameters: {
            dataset: "fr-esr-referentiel-geographique",
            refine: {
              com_code: "75000",
            },
            timezone: "UTC",
            rows: 1,
            start: 0,
            format: "json",
          },
          records: [],
        };
      },
    };
    let source = await createAcademieSource({ apiEsSup: failingApi });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111100000" }).lean();
    assert.deepStrictEqual(
      found._meta.anomalies[0].details,
      "Impossible de déterminer l'académie pour le code insee 75000"
    );
  });
});
