const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const { importReferentiel } = require("../../../utils/testUtils");
const { insertEtablissement } = require("../../../utils/fixtures");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations relatives aux établissements du catalogue", async () => {
    await importReferentiel();
    await insertEtablissement({
      uai: "1234567W",
      siret: "11111111100006",
      entreprise_raison_sociale: "Centre de formation",
    });
    let source = await createSource("catalogue");

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["catalogue"],
        uai: "1234567W",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await importReferentiel();
    await insertEtablissement({
      uai: "1234567W",
      siret: "11111111100006",
      entreprise_raison_sociale: "Centre de formation",
    });
    let source = await createSource("catalogue");

    let stats = await collectSources(source, {
      filters: { siret: "33333333300008" },
    });

    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 0,
        updated: 0,
        ignored: 0,
        failed: 0,
      },
    });
  });
});
