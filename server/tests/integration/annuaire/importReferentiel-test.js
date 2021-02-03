const assert = require("assert");
const csv = require("csv-parse");
const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { createApiEntrepriseMock, createaApiGeoAddresseMock } = require("../../utils/mocks");
const importReferentiel = require("../../../src/jobs/annuaire/importReferentiel");
const { createReferentiel } = require("../../../src/jobs/annuaire/referentiels/referentiels");
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
      `"uai";"siret";"nom"
"0011058V";"11111111111111";"Centre de formation"`
    );

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      referentiel: "test",
      uais_secondaires: [],
      siegeSocial: true,
      statut: "actif",
      adresse: {
        position: { coordinates: [2.396444, 48.879706], type: "Point" },
        label: "31 Rue des Lilas 75019 Paris",
        region: "11",
        numero_voie: "31",
        type_voie: "RUE",
        nom_voie: "DES LILAS",
        code_postal: "75001",
        localite: "PARIS",
        code_insee_localite: "75000",
      },
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      ignored: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des informations de l'entreprise", async () => {
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let failingApiEntreprise = {
      getEtablissement: () => {
        throw new Error("HTTP error");
      },
    };
    let referentiel = createFakeReferentiel(
      `"uai";"siret";"nom"
"0011058V";"11111111111111";"Centre de formation"`
    );

    let results = await importReferentiel(referentiel, failingApiEntreprise, apiGeoAddresse);

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
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let referentiel = createFakeReferentiel(`"uai";"siret";"nom"
"0011058V";"11111111111111";"Centre de formation"
"0011058V";"11111111111111";"Centre de formation"`);

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

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
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let referentiel = createFakeReferentiel(`"uai";"siret";"nom"
"0011058V";"";"Centre de formation"`);

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

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
    let apiGeoAddresse = createaApiGeoAddresseMock();
    let referentiel = createReferentiel(
      "depp",
      createStream(`"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`)
    );

    let results = await importReferentiel(referentiel, apiEntreprise, apiGeoAddresse);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      referentiel: "depp",
      uais_secondaires: [],
      siegeSocial: true,
      statut: "actif",
      adresse: {
        position: { coordinates: [2.396444, 48.879706], type: "Point" },
        label: "31 Rue des Lilas 75019 Paris",
        region: "11",
        numero_voie: "31",
        type_voie: "RUE",
        nom_voie: "DES LILAS",
        code_postal: "75001",
        localite: "PARIS",
        code_insee_localite: "75000",
      },
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
    assert.deepStrictEqual(docs[0], {
      siret: "11111111111111",
      nom: "Centre de formation",
      referentiel: "dgefp",
      uais_secondaires: [],
      siegeSocial: true,
      statut: "actif",
      adresse: {
        position: { coordinates: [2.396444, 48.879706], type: "Point" },
        label: "31 Rue des Lilas 75019 Paris",
        region: "11",
        numero_voie: "31",
        type_voie: "RUE",
        nom_voie: "DES LILAS",
        code_postal: "75001",
        localite: "PARIS",
        code_insee_localite: "75000",
      },
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      ignored: 0,
      failed: 0,
    });
  });
});
