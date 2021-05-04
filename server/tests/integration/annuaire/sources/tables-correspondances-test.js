const assert = require("assert");
const { Etablissement, Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const { importReferentiel } = require("../../../utils/testUtils");
const collect = require("../../../../src/jobs/annuaire/collect");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations relatives aux établissements du catalogue", async () => {
    await importReferentiel();
    await Etablissement.create({
      uai: "0011073L",
      siret: "11111111111111",
      entreprise_raison_sociale: "Centre de formation",
    });
    let source = await createSource("tables-correspondances");

    let stats = await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["tables-correspondances"],
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      "tables-correspondances": {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await importReferentiel();
    await Etablissement.create({
      uai: "0011073L",
      siret: "11111111111111",
      entreprise_raison_sociale: "Centre de formation",
    });
    let source = await createSource("tables-correspondances");

    let stats = await collect(source, {
      filters: { siret: "33333333333333" },
    });

    assert.deepStrictEqual(stats, {
      "tables-correspondances": {
        total: 0,
        updated: 0,
        failed: 0,
      },
    });
  });
});
