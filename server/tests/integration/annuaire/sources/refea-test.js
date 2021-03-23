const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { importReferentiel, createStream } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier REFEA", async () => {
    await importReferentiel();
    let source = await createSource("refea", {
      input: createStream(
        `uai_code_siret;uai_code_educnationale;uai_libelle_educnationale
"11111111111111";"0011073L";"Centre de formation"`
      ),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        sources: ["refea"],
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      refea: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });
});
