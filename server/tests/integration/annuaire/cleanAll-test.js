const assert = require("assert");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const cleanAll = require("../../../src/jobs/annuaire/cleanAll");
const { createAnnuaire } = require("../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut supprimer un annuaire", async () => {
    await createAnnuaire({
      uai: "0011058V",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      uaisSecondaires: [],
    }).save();

    let stats = await cleanAll();

    let count = await Annuaire.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, {
      deleted: 1,
    });
  });
});
