const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier ccca-btp", async () => {
    await insertAnnuaire({
      siret: "11111111111111",
      uais: [
        {
          source: "test",
          uai: "0011073L",
          valide: true,
        },
      ],
    });
    let source = await createSource("ccca-btp", {
      input: createStream(
        `uai
"0011073L"`
      ),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["ccca-btp"]);
    assert.deepStrictEqual(stats, {
      "ccca-btp": {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });
});
