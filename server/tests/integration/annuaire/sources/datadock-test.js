const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createStream } = require("../../../utils/testUtils");
const { createAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations datadock", async () => {
    await createAnnuaire({ siret: "11111111111111" });
    await createAnnuaire({ siret: "22222222222222" });
    let source = await createSource("datadock", {
      input: createStream(
        `siret;REFERENCABLE
"11111111111111";"OUI"
"22222222222222";"NON"`
      ),
    });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.strictEqual(found.conformite_reglementaire.certificateur, "datadock");
    found = await Annuaire.findOne({ siret: "22222222222222" }, { _id: 0 }).lean();
    assert.strictEqual(found.conformite_reglementaire.certificateur, undefined);

    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut préserver le conventionnement", async () => {
    await createAnnuaire({
      siret: "11111111111111",
      conformite_reglementaire: {
        conventionne: true,
      },
    });
    let source = await createSource("datadock", {
      input: createStream(
        `siret;REFERENCABLE
"11111111111111";"OUI"`
      ),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.strictEqual(found.conformite_reglementaire.conventionne, true);
  });
});
