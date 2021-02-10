const assert = require("assert");
const { Etablissement, Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const { importReferentiel } = require("../../../utils/testUtils");
const collect = require("../../../../src/jobs/annuaire/collect");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations de la base catalogue", async () => {
    await importReferentiel();
    await Etablissement.create({
      uai: "0011073L",
      siret: "11111111111111",
      entreprise_raison_sociale: "Centre de formation",
    });
    let source = await createSource("catalogue");

    let results = await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uaisSecondaires, [
      {
        type: "catalogue",
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });
});
