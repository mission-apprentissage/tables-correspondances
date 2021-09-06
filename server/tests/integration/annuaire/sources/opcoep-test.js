const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const { importReferentiel, createStream } = require("../../../utils/testUtils");
const collectSources = require("../../../../src/jobs/annuaire/tasks/collectSources");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier OPCO EP", async () => {
    await importReferentiel();
    let source = createSource("opcoep", {
      input: createStream(
        `SIRET CFA;N UAI CFA;Nom CFA
"11111111100006";"0111111Y";"Centre de formation"`
      ),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["opcoep"],
        uai: "0111111Y",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      opcoep: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });
});
