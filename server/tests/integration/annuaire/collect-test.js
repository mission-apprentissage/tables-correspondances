const assert = require("assert");
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
  const prepareAnnuaire = (content) => {
    let referentiel = createReferentiel(
      "depp",
      createStream(
        content ||
          `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`
      )
    );

    return importReferentiel(referentiel);
  };

  const createTestSource = (content) => {
    let stream = createStream(content);
    let source = oleoduc(
      stream,
      csv({
        delimiter: ";",
        bom: true,
        columns: true,
      }),
      transformData((data) => {
        return {
          siret: data.siret,
          data: {
            uai: data.uai,
          },
        };
      })
    );
    source.type = "test";
    return source;
  };

  it("Vérifie qu'on peut collecter un uai", async () => {
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret";"nom"
"0011073L";"11111111111111";"Centre de formation"`
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
      `"uai";"siret";"nom"
"093XXXT";"11111111111111";"Centre de formation"`
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
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
      `"uai";"siret";"nom"
"0011058V";"11111111111111";"Centre de formation"`
    );

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe déjà en tant qu'uai secondaire", async () => {
    let source = createTestSource(
      `"uai";"siret";"nom"
"0011073L";"11111111111111";"Centre de formation"`
    );
    await createAnnuaire({
      uai: "0011058V",
      siret: "11111111111111",
      uais_secondaires: [
        {
          type: "test",
          uai: "0011073L",
          valide: true,
        },
      ],
    }).save();

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
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
      `"uai";"siret";"nom"
"";"11111111111111";"Centre de formation"`
    );

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });
});
