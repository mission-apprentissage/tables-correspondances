const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const { importReferentiel, createStream } = require("../../../utils/testUtils");
const collect = require("../../../../src/jobs/annuaire/collect");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier OPCO EP", async () => {
    await importReferentiel();
    let source = await createSource("opcoep", {
      input: createStream(
        `SIRET CFA;N UAI CFA;Nom CFA
"11111111111111";"0011073L";"Centre de formation"`
      ),
    });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "opcoep",
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
});
