const assert = require("assert");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const cleanAll = require("../../../src/jobs/annuaire/cleanAll");
const { insertAnnuaire } = require("../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut supprimer un annuaire", async () => {
    await insertAnnuaire({
      uai: "0011058V",
      siret: "11111111111111",
      raison_sociale: "Centre de formation",
      uais: [],
    });

    let stats = await cleanAll();

    let count = await Annuaire.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, {
      deleted: 1,
    });
  });
});
