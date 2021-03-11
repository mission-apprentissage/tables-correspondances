const assert = require("assert");
const { omit } = require("lodash");
const { Readable } = require("stream");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { createAnnuaire } = require("../../utils/fixtures");
const collect = require("../../../src/jobs/annuaire/collect");

integrationTests(__filename, () => {
  function createTestSource(array) {
    return {
      type: "test",
      stream() {
        return Readable.from(array);
      },
    };
  }

  it("Vérifie qu'on peut collecter un uai", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: ["0011073L"],
      },
    ]);

    let results = await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "test",
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie qu'on teste la validité d'un UAI", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: ["093XXXT"],
      },
    ]);

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires[0], {
      type: "test",
      uai: "093XXXT",
      valide: false,
    });
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe en tant qu'uai principal", async () => {
    await createAnnuaire({ siret: "111111111111111", uai: "0011058V" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: ["0011058V"],
      },
    ]);

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe déjà en tant qu'uai secondaire", async () => {
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: ["0011073L"],
      },
    ]);
    await createAnnuaire({
      uai: "0011058V",
      siret: "111111111111111",
      uais_secondaires: [
        {
          type: "test",
          uai: "0011073L",
          valide: true,
        },
      ],
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "test",
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai avec une donnée invalide", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: ["", null, "NULL"],
      },
    ]);

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on stocke une erreur survenue durant une collecte", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        anomalies: [new Error("Erreur")],
      },
    ]);

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0, __v: 0 }).lean();
    let errors = found._meta.anomalies;
    assert.ok(errors[0].date);
    assert.deepStrictEqual(omit(errors[0], ["date"]), {
      details: "Erreur",
      source: "test",
      type: "collect",
    });
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 1,
      updated: 0,
    });
  });

  it("Vérifie qu'on peut collecter des relations", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        relations: [{ siret: "22222222222222", annuaire: false, label: "Centre de formation", type: "gestionnaire" }],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        annuaire: false,
        label: "Centre de formation",
        type: "gestionnaire",
        source: "test",
      },
    ]);
  });

  it("Vérifie qu'on ne duplique pas les relations", async () => {
    await createAnnuaire({
      siret: "111111111111111",
      relations: [
        {
          siret: "22222222222222",
          annuaire: false,
          label: "test",
          type: "gestionnaire",
          source: "test",
        },
      ],
    });
    let source = createTestSource([
      {
        selector: "111111111111111",
        relations: [{ siret: "22222222222222", annuaire: false, label: "test", type: "gestionnaire" }],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(found.relations.length, 1);
    assert.strictEqual(found.relations[0].siret, "22222222222222");
    assert.strictEqual(found.relations[0].type, "gestionnaire");
  });

  it("Vérifie qu'on peut détecter des relations entre établissements de l'annuaire", async () => {
    await createAnnuaire({ siret: "11111111111111" });
    await createAnnuaire({ siret: "22222222222222", raison_sociale: "Centre de formation" });
    let source = createTestSource([
      {
        selector: "11111111111111",
        relations: [{ siret: "22222222222222", label: "test" }],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        label: "Centre de formation",
        annuaire: true,
        source: "test",
      },
    ]);
  });

  it("Vérifie qu'on peut collecter des reseaux", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        reseaux: ["test"],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["test"]);
  });

  it("Vérifie qu'on ne duplique pas les reseaux", async () => {
    await createAnnuaire({
      siret: "111111111111111",
      reseaux: ["test"],
    });
    let source = createTestSource([
      {
        selector: "111111111111111",
        reseaux: ["test"],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["test"]);
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        reseaux: ["test"],
      },
    ]);

    let results = await collect(source, { filters: { siret: "33333333333333" } });

    assert.deepStrictEqual(results, {
      total: 0,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut collecter en se basant sur l'uai", async () => {
    await createAnnuaire({ siret: "111111111111111", uai: "0011073X" });
    let source = createTestSource([
      {
        selector: "0011073X",
        reseaux: ["test"],
      },
    ]);

    let results = await collect(source);

    let found = await Annuaire.findOne({ uai: "0011073X" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["test"]);
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie qu'on peut collecter en se basant sur un uai secondaire", async () => {
    await createAnnuaire({
      uai: "0011073X",
      siret: "111111111111111",
      uais_secondaires: [
        {
          type: "test",
          uai: "SECONDAIRE",
          valide: true,
        },
      ],
    });
    let source = createTestSource([
      {
        selector: "SECONDAIRE",
        reseaux: ["test"],
      },
    ]);

    let results = await collect(source);

    let found = await Annuaire.findOne({ uai: "0011073X" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["test"]);
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });
});
