const assert = require("assert");
const { omit } = require("lodash");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createApiEntrepriseMock, createaApiGeoAddresseMock } = require("../../../utils/mocks");
const importReferentiel = require("../../../../src/jobs/annuaire/importReferentiel");
const { createReferentiel } = require("../../../../src/jobs/annuaire/referentiels/referentiels");
const { createStream } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut ajouter le référentiel de la DEPP", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let referentiel = createReferentiel(
      "depp",
      createStream(`"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`)
    );

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(omit(found, ["_meta"]), {
      uai: "0011058V",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      referentiel: "depp",
      uaisSecondaires: [],
      liens: [],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      created: 1,
      updated: 0,
      failed: 0,
    });
  });
});
