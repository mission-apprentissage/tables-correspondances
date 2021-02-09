const assert = require("assert");
const { omit } = require("lodash");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createApiEntrepriseMock, createaApiGeoAddresseMock } = require("../../../utils/mocks");
const importReferentiel = require("../../../../src/jobs/annuaire/importReferentiel");
const { createReferentiel } = require("../../../../src/jobs/annuaire/referentiels/referentiels");
const { createStream } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut ajouter le référentiel de la DGEFP", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let referentiel = createReferentiel(
      "dgefp",
      createStream(`"raison_sociale";"siren";"num_etablissement";"cfa"
"Centre de formation";"111111111";"11111";"Oui"
"Centre de formation 2";"222222222";"22222";"Non"`)
    );

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

    let docs = await Annuaire.find({}, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(docs.length, 1);
    assert.deepStrictEqual(omit(docs[0], ["_meta"]), {
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      referentiel: "dgefp",
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
