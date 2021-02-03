const assert = require("assert");
const csv = require("csv-parse");
const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { createApiEntrepriseMock } = require("../../utils/mocks");
const importReferentiel = require("../../../src/jobs/annuaire/importReferentiel");
const { createReferentiel } = require("../../../src/jobs/annuaire/referentiels/referentiels");
const { createStream } = require("../../utils/testUtils");

integrationTests(__filename, () => {
  const createFakeReferentiel = (content) => {
    let stream = createStream(content);
    let referentiel = oleoduc(
      stream,
      csv({
        delimiter: ";",
        columns: true,
      })
    );
    referentiel.type = "test";
    return oleoduc(
      referentiel,
      transformData((data) => ({ ...data, referentiel: "test" }))
    );
  };

  it("Vérifie qu'on peut initialiser un annuaire avec un référentiel", async () => {
    let apiEntreprise = createApiEntrepriseMock({ siret: "11111111111111" });
    let referentiel = createFakeReferentiel(
      `"uai";"siret";"nom"
"0011058V";"11111111111111";"Centre de formation"`
    );

    let results = await importReferentiel(referentiel, apiEntreprise);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      referentiel: "test",
      uais_secondaires: [],
      region: "11",
      dateCreation: new Date("2020-11-26T23:00:00.000Z"),
      siegeSocial: true,
      statut: "actif",
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      ignored: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des informations de l'entreprise", async () => {
    let referentiel = createFakeReferentiel(
      `"uai";"siret";"nom"
"0011058V";"11111111111111";"Centre de formation"`
    );

    let results = await importReferentiel(referentiel, {
      getEtablissement: () => {
        throw new Error("HTTP error");
      },
    });

    let count = await Annuaire.count({ siret: "11111111111111" });
    assert.deepStrictEqual(count, 0);
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 0,
      ignored: 0,
      failed: 1,
    });
  });

  it("Vérifie qu'on ignore les établissements en double", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let referentiel = createFakeReferentiel(`"uai";"siret";"nom"
"0011058V";"11111111111111";"Centre de formation"
"0011058V";"11111111111111";"Centre de formation"`);

    let results = await importReferentiel(referentiel, apiEntreprise);

    await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(results, {
      total: 2,
      inserted: 1,
      ignored: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut ignorer un établissement avec un siret vide", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let referentiel = createFakeReferentiel(`"uai";"siret";"nom"
"0011058V";"";"Centre de formation"`);

    let results = await importReferentiel(referentiel, apiEntreprise);

    let count = await Annuaire.countDocuments({ siret: "11111111111111" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 0,
      ignored: 0,
      failed: 1,
    });
  });

  it("Vérifie qu'on peut ajouter le référentiel de la DEPP", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let referentiel = createReferentiel(
      "depp",
      createStream(`"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`)
    );

    let results = await importReferentiel(referentiel, apiEntreprise);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      referentiel: "depp",
      uais_secondaires: [],
      region: "11",
      dateCreation: new Date("2020-11-26T23:00:00.000Z"),
      siegeSocial: true,
      statut: "actif",
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      ignored: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut ajouter le référentiel de la DGEFP", async () => {
    let apiEntreprise = createApiEntrepriseMock();
    let referentiel = createReferentiel(
      "dgefp",
      createStream(`"raison_sociale";"siren";"num_etablissement";"cfa"
"Centre de formation";"111111111";"11111";"Oui"
"Centre de formation 2";"222222222";"22222";"Non"`)
    );

    let results = await importReferentiel(referentiel, apiEntreprise);

    let docs = await Annuaire.find({}, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(docs.length, 1);
    assert.deepStrictEqual(docs[0], {
      siret: "11111111111111",
      nom: "Centre de formation",
      referentiel: "dgefp",
      uais_secondaires: [],
      region: "11",
      dateCreation: new Date("2020-11-26T23:00:00.000Z"),
      siegeSocial: true,
      statut: "actif",
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      ignored: 0,
      failed: 0,
    });
  });
});
