const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/tasks/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des emails à partir du fichier des voeux-affelnet", async () => {
    await insertAnnuaire({ siret: "11111111100006", uai: "0111111Y" });
    let source = await createSource("voeux-affelnet", {
      input: createStream(
        `email;uai
"robert@formation.fr";"0111111Y"`
      ),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.contacts, [
      {
        email: "robert@formation.fr",
        confirmé: true,
        sources: ["voeux-affelnet"],
      },
    ]);
    assert.deepStrictEqual(stats, {
      "voeux-affelnet": {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });
});
