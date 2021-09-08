const assert = require("assert");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const cleanAll = require("../../../src/jobs/annuaire/clear");
const { insertAnnuaire } = require("../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut supprimer un annuaire", async () => {
    await insertAnnuaire();

    let stats = await cleanAll();

    let count = await Annuaire.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, {
      deleted: 1,
    });
  });
});
