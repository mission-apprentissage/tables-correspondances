const assert = require("assert");
const { omit } = require("lodash");
const csv = require("csv-parse");
const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { createApiEntrepriseMock, createaApiGeoAddresseMock } = require("../../utils/mocks");
const importReferentiel = require("../../../src/jobs/annuaire/importReferentiel");
const { createStream } = require("../../utils/testUtils");

const createFakeReferentiel = (content) => {
  let stream = createStream(content);
  let referentiel = oleoduc(
    stream,
    csv({
      delimiter: ";",
      columns: true,
    }),
    transformData((data) => ({ ...data, referentiel: "test" }))
  );
  referentiel.type = "test";
  return referentiel;
};

integrationTests(__filename, () => {
  it("Vérifie qu'on peut initialiser un annuaire à partir d'un référentiel", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let referentiel = createFakeReferentiel(
      `"uai";"siret";"raisonSociale"
"0011058V";"11111111111111";"Centre de formation"`
    );

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(omit(found, ["_meta"]), {
      uai: "0011058V",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      referentiel: "test",
      uaisSecondaires: [],
      liens: [],
    });
    assert.ok(found._meta.lastUpdate);
    assert.deepStrictEqual(omit(found._meta, ["lastUpdate"]), {
      _errors: [],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      created: 1,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on ignore les établissements en double", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let referentiel = createFakeReferentiel(`"uai";"siret";"raisonSociale"
"0011058V";"11111111111111";"Centre de formation"
"0011058V";"11111111111111";"Centre de formation"`);

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

    await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(results, {
      total: 2,
      created: 1,
      updated: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut ignorer un établissement avec un siret vide", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let referentiel = createFakeReferentiel(`"uai";"siret";"raisonSociale"
"0011058V";"";"Centre de formation"`);

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

    let count = await Annuaire.countDocuments({ siret: "11111111111111" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(results, {
      total: 1,
      created: 0,
      updated: 0,
      failed: 1,
    });
  });
});
