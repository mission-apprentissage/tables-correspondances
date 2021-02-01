const assert = require("assert");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const deleteAll = require("../../../src/jobs/annuaire/deleteAll");
const { createAnnuaire } = require("../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut supprimer un annuaire", async () => {
    await createAnnuaire({
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
    }).save();

    await deleteAll();

    let count = await Annuaire.countDocuments();
    assert.strictEqual(count, 0);
  });
});
