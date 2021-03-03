const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { importReferentiel, createStream } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier ONISEP (structure)", async () => {
    await importReferentiel();
    let source = await createSource(
      "onisepStructure",
      createStream(
        `STRUCT SIRET;STRUCT UAI;STRUCT Libellé Amétys
"11111111111111";"0011073L";"Centre de formation"`
      )
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "onisepStructure",
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
      "onisepStructure",
      createStream(
        `STRUCT SIRET;STRUCT UAI;STRUCT Libellé Amétys
"11111111111111";"0011073L";"Centre de formation"
"33333333333333";"0011073";"Centre de formation"`
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
