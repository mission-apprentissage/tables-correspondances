const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier gesti", async () => {
    await insertAnnuaire({ siret: "11111111100006", uai: "1111111A" });
    let source = await createSource("gesti", {
      input: createStream(
        `uai_code_educnationale;siret
"1234567W";"11111111100006"`
      ),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["gesti"],
        uai: "1234567W",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      gesti: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });
});
