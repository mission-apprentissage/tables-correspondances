const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { importReferentiel, createStream } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier ONISEP", async () => {
    await importReferentiel();
    let source = await createSource(
      "onisep",
      createStream(
        `"code UAI";"n° SIRET";"nom"
"0011073L";"11111111111111";"Centre de formation"`
      )
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "onisep",
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await importReferentiel();
    let source = await createSource(
      "onisep",
      createStream(
        `"code UAI";"n° SIRET";"nom"
"0011073L";"11111111111111";"Centre de formation"
"0011073L";"33333333333333";"Centre de formation"`
      ),
      { filters: { siret: "33333333333333" } }
    );

    let results = await collect(source);

    assert.deepStrictEqual(results, {
      total: 1,
      updated: 0,
      failed: 0,
    });
  });
});
