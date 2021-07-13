const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier promotrans", async () => {
    await insertAnnuaire({ siret: "11111111100006" });
    let source = await createSource("promotrans", {
      input: createStream(
        `siret;uai
"11111111100006";"1234567W"`
      ),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.reseaux, ["promotrans"]);
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["promotrans"],
        uai: "1234567W",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      promotrans: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });
});
