const assert = require("assert");
const { omit } = require("lodash");
const { oleoduc, transformData } = require("oleoduc");
const { Readable } = require("stream");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { createAnnuaire } = require("../../utils/fixtures");
const collect = require("../../../src/jobs/annuaire/collect");

integrationTests(__filename, () => {
  function createTestSource(array) {
    let name = "dummy";
    return {
      name,
      stream() {
        return oleoduc(
          Readable.from(array),
          transformData((d) => ({ source: name, ...d })),
          { promisify: false }
        );
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

    let stats = await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["dummy"],
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      dummy: {
        total: 1,
        failed: 0,
        updated: 1,
      },
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

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais[0], {
      sources: ["dummy"],
      uai: "093XXXT",
      valide: false,
    });
    assert.deepStrictEqual(stats, {
      dummy: {
        total: 1,
        failed: 0,
        updated: 1,
      },
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe déjà dans la liste des uais", async () => {
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: ["0011073L"],
      },
    ]);
    await createAnnuaire({
      uai: "0011058V",
      siret: "111111111111111",
      uais: [
        {
          sources: ["dummy"],
          uai: "0011073L",
          valide: true,
        },
      ],
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["dummy"],
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      dummy: {
        total: 1,
        failed: 0,
        updated: 0,
      },
    });
  });

  it("Vérifie qu'on fusionne un uai déjà collecté part une autre source", async () => {
    await createAnnuaire({
      siret: "111111111111111",
      uais: [
        {
          sources: ["other"],
          uai: "0011073L",
          valide: true,
        },
      ],
    });
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: ["0011073L"],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, found.uais, [
      {
        sources: ["other", "dummy"],
        uai: "0011073L",
        valide: true,
      },
    ]);
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

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, []);
    assert.deepStrictEqual(stats, {
      dummy: {
        total: 1,
        failed: 0,
        updated: 0,
      },
    });
  });

  it("Vérifie qu'on ignore un établissement quand il est inconnu", async () => {
    await createAnnuaire({ siret: "222222222222222" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: ["", null, "NULL"],
      },
    ]);

    let stats = await collect(source);

    let count = await Annuaire.countDocuments({ siret: "111111111111111" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, {
      dummy: {
        total: 1,
        failed: 0,
        updated: 0,
      },
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

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0 }).lean();
    let errors = found._meta.anomalies;
    assert.ok(errors[0].date);
    assert.deepStrictEqual(omit(errors[0], ["date"]), {
      details: "Erreur",
      source: "dummy",
      task: "collect",
    });
    assert.deepStrictEqual(stats, {
      dummy: {
        total: 1,
        failed: 1,
        updated: 0,
      },
    });
  });

  it("Vérifie qu'on stocke une erreur survenue technique", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: "111111111111111",
        uais: null,
      },
    ]);

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0 }).lean();
    let errors = found._meta.anomalies;
    assert.ok(errors[0].date);
    assert.deepStrictEqual(omit(errors[0], ["date"]), {
      details: "Cannot read property 'filter' of null",
      source: "dummy",
      task: "collect",
    });
    assert.deepStrictEqual(stats, {
      dummy: {
        total: 1,
        failed: 1,
        updated: 0,
      },
    });
  });

  it("Vérifie qu'on rejete un selecteur vide", async () => {
    await createAnnuaire({ siret: "111111111111111" });
    let source = createTestSource([
      {
        selector: {},
        uais: [],
      },
    ]);

    try {
      await collect(source);
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "Select must not be empty");
    }
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

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        annuaire: false,
        label: "Centre de formation",
        type: "gestionnaire",
        sources: ["dummy"],
      },
    ]);
  });

  it("Vérifie qu'on peut fusionner une relation déjà collectée", async () => {
    await createAnnuaire({
      siret: "111111111111111",
      relations: [
        {
          siret: "22222222222222",
          annuaire: false,
          label: "Centre de formation",
          type: "gestionnaire",
          sources: ["other"],
        },
      ],
    });
    let source = createTestSource([
      {
        selector: "111111111111111",
        relations: [{ siret: "22222222222222", label: "Centre de formation", type: "gestionnaire" }],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
    assert.deepStrictEqual(found.relations[0].sources, ["other", "dummy"]);
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
          source: "dummy",
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

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
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

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        label: "test",
        annuaire: true,
        sources: ["dummy"],
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

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
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

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
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

    let stats = await collect(source, { filters: { siret: "33333333333333" } });

    assert.deepStrictEqual(stats, {
      dummy: {
        total: 0,
        updated: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter en se basant sur un uai", async () => {
    await createAnnuaire({
      uai: "0011073X",
      siret: "111111111111111",
      uais: [
        {
          source: "dummy",
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

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "111111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["test"]);
    assert.deepStrictEqual(stats, {
      dummy: {
        total: 1,
        failed: 0,
        updated: 1,
      },
    });
  });
});
