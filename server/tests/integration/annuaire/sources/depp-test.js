const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter l'uai formateur et les informations de conformité", async () => {
    await insertAnnuaire({
      siret: "11111111111111",
    });
    let source = await createSource("depp", {
      input: createStream(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"11111111111111"`),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["depp"],
        uai: "0011058V",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(found.conformite_reglementaire, { conventionne: true });
    assert.deepStrictEqual(stats, {
      depp: {
        total: 1,
        updated: 1,
        failed: 0,
        ignored: 0,
      },
    });
  });
});
