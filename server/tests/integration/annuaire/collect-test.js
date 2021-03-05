const assert = require("assert");
const { omit } = require("lodash");
const { Readable } = require("stream");
const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { createReferentiel } = require("../../../src/jobs/annuaire/referentiels/referentiels");
const { createAnnuaire } = require("../../utils/fixtures");
const importReferentiel = require("../../../src/jobs/annuaire/importReferentiel");
const collect = require("../../../src/jobs/annuaire/collect");
const { createStream } = require("../../utils/testUtils");

integrationTests(__filename, () => {
  const prepareAnnuaire = async (content) => {
    let referentiel = await createReferentiel("depp", {
      input: createStream(
        content ||
          `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"111111111111111";"Centre de formation"`
      ),
    });

    return importReferentiel(referentiel);
  };

  const createTestSource = (content) => {
    let source = oleoduc(
      createStream(content),
      csv({
        delimiter: ";",
        bom: true,
        columns: true,
      }),
      transformData((data) => {
        return {
          siret: data.siret,
          uais: [data.uai],
        };
      })
    );
    source.type = "test";
    return source;
  };

  const createTestSource2 = (array) => {
    let source = Readable.from(array);
    source.type = "test";
    return source;
  };

  it("Vérifie qu'on peut collecter un uai", async () => {
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret"
0011073L;111111111111111`
    );

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
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret"
093XXXT;111111111111111`
    );

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
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret"
"0011058V";"111111111111111"`
    );

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
    let source = createTestSource(
      `"uai";"siret"
0011073L;111111111111111`
    );
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

  it("Vérifie qu'on ignore un uai vide", async () => {
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret"
"";"111111111111111"`
    );

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
    await prepareAnnuaire();
    let source = oleoduc(
      createTestSource(
        `"uai";"siret"
"";"111111111111111"`
      ),
      transformData(() => {
        return { anomalies: [new Error("Erreur")], siret: "111111111111111" };
      })
    );
    source.type = "test";

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
    await prepareAnnuaire();
    let source = createTestSource2([
      {
        siret: "111111111111111",
        relations: [{ siret: "22222222222222", annuaire: false, label: "test", type: "gestionnaire" }],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        annuaire: false,
        label: "test",
        type: "gestionnaire",
      },
    ]);
  });

  it("Vérifie qu'on met à jour les relations existantes sans les dupliquer", async () => {
    await prepareAnnuaire();
    await Annuaire.updateOne(
      { siret: "111111111111111" },
      {
        $set: {
          relations: [
            {
              siret: "22222222222222",
              annuaire: false,
              label: "test",
            },
          ],
        },
      }
    );
    let source = createTestSource2([
      {
        siret: "111111111111111",
        relations: [{ siret: "22222222222222", annuaire: false, label: "test", type: "gestionnaire" }],
      },
    ]);

    await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(found.relations.length, 1);
    assert.strictEqual(found.relations[0].siret, "22222222222222");
    assert.strictEqual(found.relations[0].type, "gestionnaire");
  });
});
