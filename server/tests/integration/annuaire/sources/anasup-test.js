const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier anasup", async () => {
    await insertAnnuaire({ siret: "11111111111111", uai: "1111111A" });
    let source = await createSource("anasup", {
      input: createStream(
        `siret;uai
"11111111111111";"0011073L"`
      ),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["anasup"]);
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["anasup"],
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      anasup: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });
});
