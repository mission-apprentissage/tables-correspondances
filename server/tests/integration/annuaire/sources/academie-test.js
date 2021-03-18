const assert = require("assert");
const ApiError = require("../../../../src/common/apis/ApiError");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createApiEsSup } = require("../../../utils/mocks");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations de l'académie", async () => {
    await createAnnuaire({
      siret: "11111111100000",
      adresse: {
        code_insee: "75000",
      },
    });
    let source = await createSource("academie", { apiEsSup: createApiEsSup() });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111100000" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.academie, {
      code: "01",
      nom: "Paris",
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await createAnnuaire({
      siret: "11111111100000",
    });
    let source = await createSource("academie", { apiEsSup: createApiEsSup() });

    let results = await collect(source, { filters: { siret: "33333333333333" } });

    assert.deepStrictEqual(results, {
      total: 0,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on ignore les établissements sans adresse", async () => {
    await createAnnuaire({
      siret: "11111111100000",
      adresse: null,
    });
    let source = await createSource("academie", { apiEsSup: createApiEsSup() });

    let results = await collect(source);

    assert.deepStrictEqual(results, {
      total: 0,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on gère une anomalie quand on ne peut pas collecter d'informations", async () => {
    await createAnnuaire({
      siret: "11111111100000",
      adresse: {
        code_insee: "75000",
      },
    });
    let failingApi = {
      fetchInfoFromCodeCommune: () => {
        throw new ApiError("api-es", "Too many requests", 429);
      },
    };
    let source = await createSource("academie", { apiEsSup: failingApi });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111100000" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "[api-es] Too many requests");
  });

  it("Vérifie qu'on gère une anomalie quand la réponse est vide", async () => {
    await createAnnuaire({
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
    let source = await createSource("academie", { apiEsSup: failingApi });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111100000" }).lean();
    assert.deepStrictEqual(
      found._meta.anomalies[0].details,
      "Impossible de déterminer l'académie pour le code insee 75000"
    );
  });
});
