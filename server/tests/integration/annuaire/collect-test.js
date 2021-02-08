const assert = require("assert");
const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");
const { Etablissement, Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { createApiSireneMock } = require("../../utils/mocks");
const { createSource } = require("../../../src/jobs/annuaire/sources/sources");
const { createReferentiel } = require("../../../src/jobs/annuaire/referentiels/referentiels");
const { createAnnuaire } = require("../../utils/fixtures");
const importReferentiel = require("../../../src/jobs/annuaire/importReferentiel");
const collect = require("../../../src/jobs/annuaire/collect");
const { createStream } = require("../../utils/testUtils");

integrationTests(__filename, () => {
  const prepareAnnuaire = (content) => {
    let referentiel = createReferentiel(
      "depp",
      createStream(
        content ||
          `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`
      )
    );

    return importReferentiel(referentiel);
  };

  const createTestSource = (content) => {
    let stream = createStream(content);
    let source = oleoduc(
      stream,
      csv({
        delimiter: ";",
        bom: true,
        columns: true,
      }),
      transformData((data) => {
        return {
          siret: data.siret,
          data: {
            uai: data.uai,
          },
        };
      })
    );
    source.type = "test";
    return source;
  };

  it("Vérifie qu'on peut collecter un uai", async () => {
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret";"nom"
"0011073L";"11111111111111";"Centre de formation"`
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "test",
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie qu'on teste la validité d'un UAI", async () => {
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret";"nom"
"093XXXT";"11111111111111";"Centre de formation"`
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires[0], {
      type: "test",
      uai: "093XXXT",
      valide: false,
    });
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe en tant qu'uai principal", async () => {
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret";"nom"
"0011058V";"11111111111111";"Centre de formation"`
    );

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe déjà en tant qu'uai secondaire", async () => {
    let source = createTestSource(
      `"uai";"siret";"nom"
"0011073L";"11111111111111";"Centre de formation"`
    );
    await createAnnuaire({
      uai: "0011058V",
      siret: "11111111111111",
      uais_secondaires: [
        {
          type: "test",
          uai: "0011073L",
          valide: true,
        },
      ],
    }).save();

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "test",
        uai: "0011073L",
        valide: true,
      },
    ]);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai vide", async () => {
    await prepareAnnuaire();
    let source = createTestSource(
      `"uai";"siret";"nom"
"";"11111111111111";"Centre de formation"`
    );

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier ONISEP", async () => {
    await prepareAnnuaire();
    let source = await createSource(
      "onisep",
      createStream(
        `"code UAI";"n° SIRET";"nom"
"0011073L";"11111111111111";"Centre de formation"`
      )
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "onisep",
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

  it("Vérifie qu'on peut collecter des informations du fichier ONISEP (structure)", async () => {
    await prepareAnnuaire();
    let source = await createSource(
      "onisepStructure",
      createStream(
        `STRUCT SIRET;STRUCT UAI;STRUCT Libellé Amétys
"11111111111111";"0011073L";"Centre de formation"`
      )
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "onisepStructure",
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

  it("Vérifie qu'on peut collecter des informations du fichier REFEA", async () => {
    await prepareAnnuaire();
    let source = await createSource(
      "refea",
      createStream(
        `uai_code_siret;uai_code_educnationale;uai_libelle_educnationale
"11111111111111";"0011073L";"Centre de formation"`
      )
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "refea",
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

  it("Vérifie qu'on peut collecter des informations de la base catalogue", async () => {
    await prepareAnnuaire();
    await Etablissement.create({
      uai: "0011073L",
      siret: "11111111111111",
      entreprise_raison_sociale: "Centre de formation",
    });
    let source = await createSource("catalogue");

    let results = await collect(source);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
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

  it("Vérifie qu'on peut collecter des informations du fichier OPCO EP", async () => {
    await prepareAnnuaire();
    let source = await createSource(
      "opcoep",
      createStream(
        `SIRET CFA;N UAI CFA;Nom CFA
"11111111111111";"0011073L";"Centre de formation"`
      )
    );

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "opcoep",
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

  it("Vérifie qu'on peut collecter des informations de l'api Sirene", async () => {
    await prepareAnnuaire();
    let source = await createSource("sirene", { apiSirene: createApiSireneMock() });

    let results = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.strictEqual(found.siegeSocial, true);
    assert.deepStrictEqual(found.statut, "actif");
    assert.deepStrictEqual(found.adresse, {
      geojson: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [2.396147, 48.880391],
        },
        properties: {
          score: 0.88,
        },
      },
      label: "31 rue des lilas Paris 75019",
      numero_voie: "31",
      type_voie: "RUE",
      nom_voie: "DES LILAS",
      code_postal: "75019",
      code_insee: "75000",
      localite: "PARIS",
      cedex: null,
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des informations de l'entreprise", async () => {
    await prepareAnnuaire();
    let failingApi = {
      getUniteLegale: () => {
        throw new Error("HTTP error");
      },
    };
    let source = await createSource("sirene", { apiSirene: failingApi });

    let results = await collect(source);

    let count = await Annuaire.count({ siret: "11111111111111" });
    assert.deepStrictEqual(count, 1);
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 0,
      failed: 1,
    });
  });
});
