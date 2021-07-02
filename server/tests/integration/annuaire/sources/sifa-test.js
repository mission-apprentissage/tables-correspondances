const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter l'uai", async () => {
    await insertAnnuaire({
      siret: "11111111100006",
    });
    let source = await createSource("sifa", {
      input: createStream(`"numero_uai";"numero_siren_siret_uai"
"1234567W";"11111111100006"`),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.conformite_reglementaire, { conventionne: true });
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["sifa"],
        uai: "1234567W",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      sifa: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });
});
