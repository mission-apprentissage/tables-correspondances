const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createStream } = require("../../../utils/testUtils");
const { createAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier mfr avec le siret", async () => {
    await createAnnuaire({ siret: "11111111111111" });
    let source = await createSource("mfr", {
      input: createStream(
        `uai;uai_code_educnationale;siret
"0011073L";"0011073X";"11111111111111"`
      ),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["mfr"]);
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["mfr"],
        uai: "0011073L",
        valide: true,
      },
      {
        sources: ["mfr"],
        uai: "0011073X",
        valide: false,
      },
    ]);
    assert.deepStrictEqual(stats, {
      mfr: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier mfr avec un uai", async () => {
    await createAnnuaire({
      uais: [
        {
          sources: ["mfr"],
          uai: "0011073L",
          valide: true,
        },
      ],
    });
    let source = await createSource("mfr", {
      input: createStream(
        `uai;uai_code_educnationale;siret
"0011073L";"0011073X";"11111111111111"`
      ),
    });

    await collect(source);

    let found = await Annuaire.findOne({ "uais.uai": "0011073L" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["mfr"]);
    assert.deepStrictEqual(found.uais[1], {
      sources: ["mfr"],
      uai: "0011073X",
      valide: false,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier mfr avec un uai_code_educnationale", async () => {
    await createAnnuaire({
      uais: [
        {
          sources: ["mfr"],
          uai: "0011073X",
          valide: false,
        },
      ],
    });
    let source = await createSource("mfr", {
      input: createStream(
        `uai;uai_code_educnationale;siret
"0011073L";"0011073X";"11111111111111"`
      ),
    });

    await collect(source);

    let found = await Annuaire.findOne({ "uais.uai": "0011073X" }).lean();
    assert.deepStrictEqual(found.reseaux, ["mfr"]);
    assert.deepStrictEqual(found.uais[0], {
      sources: ["mfr"],
      uai: "0011073L",
      valide: true,
    });
  });
});
