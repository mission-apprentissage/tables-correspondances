const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createStream } = require("../../../utils/testUtils");
const { createAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier promotrans", async () => {
    await createAnnuaire({ siret: "11111111111111", uai: "1111111A" });
    let source = await createSource("promotrans", {
      input: createStream(
        `siret;uai
"11111111111111";"0011073L"`
      ),
    });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["promotrans"]);
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "promotrans",
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
    await createAnnuaire({ siret: "11111111111111" });
    let source = await createSource("promotrans", {
      filters: { siret: "33333333333333" },
      input: createStream(
        `siret;uai
"11111111111111";"0011073L"`
      ),
    });

    let results = await collect(source);

    assert.deepStrictEqual(results, {
      total: 0,
      updated: 0,
      failed: 0,
    });
  });
});
