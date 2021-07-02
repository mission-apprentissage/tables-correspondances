const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier ccca-btp", async () => {
    await insertAnnuaire({
      siret: "11111111100006",
      uais: [
        {
          source: "test",
          uai: "1234567W",
          valide: true,
        },
      ],
    });
    let source = await createSource("ccca-btp", {
      input: createStream(
        `uai
"1234567W"`
      ),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
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
