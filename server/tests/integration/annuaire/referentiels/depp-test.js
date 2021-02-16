const assert = require("assert");
const { omit } = require("lodash");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const importReferentiel = require("../../../../src/jobs/annuaire/importReferentiel");
const { createReferentiel } = require("../../../../src/jobs/annuaire/referentiels/referentiels");
const { createStream } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut ajouter le référentiel de la DEPP", async () => {
    let referentiel = createReferentiel(
      "depp",
      createStream(`"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`)
    );

    let results = await importReferentiel(referentiel);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(omit(found, ["_meta"]), {
      uai: "0011058V",
      siret: "11111111111111",
      raison_sociale: "Centre de formation",
      referentiel: "depp",
      uais_secondaires: [],
      relations: [],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      created: 1,
      updated: 0,
      failed: 0,
    });
  });
});
