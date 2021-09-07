const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/tasks/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier mfr avec le siret", async () => {
    await insertAnnuaire({ siret: "11111111100006" });
    let source = createSource("mfr", {
      input: createStream(
        `uai;uai_code_educnationale;siret
"0111111Y";"0011073X";"11111111100006"`
      ),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["mfr"]);
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["mfr"],
        uai: "0111111Y",
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
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier mfr avec un uai", async () => {
    await insertAnnuaire({
      uai: "0111111Y",
      siret: "11111111100006",
    });
    let source = createSource("mfr", {
      input: createStream(
        `uai;uai_code_educnationale;siret
"0111111Y";"0011073X";"11111111100006"`
      ),
    });

    await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["mfr"]);
    assert.deepStrictEqual(found.uais[1], {
      sources: ["mfr"],
      uai: "0011073X",
      valide: false,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier mfr avec un uai_code_educnationale", async () => {
    await insertAnnuaire({
      uai: "0011073X",
      siret: "11111111100006",
    });
    let source = createSource("mfr", {
      input: createStream(
        `uai;uai_code_educnationale;siret
"0111111Y";"0011073X";"11111111100006"`
      ),
    });

    await collectSources(source);

    let found = await Annuaire.findOne({ "uais.uai": "0011073X" }).lean();
    assert.deepStrictEqual(found.reseaux, ["mfr"]);
    assert.deepStrictEqual(found.uais[0], {
      sources: ["mfr"],
      uai: "0111111Y",
      valide: true,
    });
  });
});
