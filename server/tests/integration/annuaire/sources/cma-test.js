const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createStream } = require("../../../utils/testUtils");
const { createAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier cma", async () => {
    await createAnnuaire({ uai: "0011073L" });
    let source = await createSource("cma", {
      input: createStream(
        `uai
"0011073L"`
      ),
    });

    let results = await collect(source);

    let found = await Annuaire.findOne({ uai: "0011073L" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["cma"]);
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });
});
