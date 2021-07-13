const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");
const { importReferentiel, createStream } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier REFEA", async () => {
    await importReferentiel();
    let source = await createSource("refea", {
      input: createStream(
        `uai_code_siret;uai_code_educnationale;uai_libelle_educnationale
"11111111100006";"1234567W";"Centre de formation"`
      ),
    });

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["refea"],
        uai: "1234567W",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      refea: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });
});
