const assert = require("assert");
const { omit } = require("lodash");
const { Readable } = require("stream");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const importReferentiel = require("../../../src/jobs/annuaire/importReferentiel");

function createTestReferentiel(array) {
  return {
    type: "test",
    stream() {
      return Readable.from(array);
    },
  };
}

integrationTests(__filename, () => {
  it("Vérifie qu'on peut initialiser un annuaire à partir d'un référentiel", async () => {
    let referentiel = createTestReferentiel([
      {
        siret: "111111111111111",
        uai: "0011058V",
      },
    ]);

    let results = await importReferentiel(referentiel);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(omit(found, ["_meta"]), {
      uai: "0011058V",
      siret: "111111111111111",
      referentiel: "test",
      conformite_reglementaire: {
        conventionne: false,
      },
      uais_secondaires: [],
      reseaux: [],
      relations: [],
      lieux_de_formation: [],
      diplomes: [],
      certifications: [],
    });
    assert.ok(found._meta.created_at);
    assert.deepStrictEqual(found._meta.anomalies, []);
    assert.deepStrictEqual(results, {
      total: 1,
      created: 1,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on ignore les établissements en double", async () => {
    let referentiel = createTestReferentiel([
      {
        siret: "111111111111111",
        uai: "0011058V",
      },
      {
        siret: "111111111111111",
        uai: "0011058V",
      },
    ]);

    let results = await importReferentiel(referentiel);

    await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(results, {
      total: 2,
      created: 1,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut ignorer un établissement avec un siret vide", async () => {
    let referentiel = createTestReferentiel([
      {
        siret: "",
        uai: "0011058V",
      },
    ]);

    let results = await importReferentiel(referentiel);

    let count = await Annuaire.countDocuments({ siret: "111111111111111" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(results, {
      total: 1,
      created: 0,
      updated: 0,
      failed: 1,
    });
  });
});
