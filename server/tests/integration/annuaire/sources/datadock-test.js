const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations datadock", async () => {
    await insertAnnuaire({ siret: "11111111100006" });
    await insertAnnuaire({ siret: "22222222200002" });
    let source = await createSource("datadock", {
      input: createStream(
        `siret;REFERENCABLE
"11111111100006";"OUI"
"22222222200002";"NON"`
      ),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.conformite_reglementaire.certificateur, "datadock");
    found = await Annuaire.findOne({ siret: "22222222200002" }, { _id: 0 }).lean();
    assert.strictEqual(found.conformite_reglementaire.certificateur, undefined);

    assert.deepStrictEqual(stats, {
      datadock: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut préserver le conventionnement", async () => {
    await insertAnnuaire({
      siret: "11111111100006",
      conformite_reglementaire: {
        conventionne: true,
      },
    });
    let source = await createSource("datadock", {
      input: createStream(
        `siret;REFERENCABLE
"11111111100006";"OUI"`
      ),
    });

    await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.conformite_reglementaire.conventionne, true);
  });
});
