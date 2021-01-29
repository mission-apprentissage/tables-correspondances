const assert = require("assert");
const { Etablissement, Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { apiEntrepriseMock } = require("../../utils/mocks");
const annuaire = require("../../../src/jobs/annuaire/annuaire");
const { createAnnuaire } = require("../../utils/fixtures");

const { createStream } = require("../../utils/testUtils");

integrationTests(__filename, () => {
  const createDEPPStream = (content) => {
    return createStream(
      content ||
        `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`
    );
  };

  it("Vérifie qu'on peut initialiser un annuaire avec le fichier de la DEPP et les informations sirene", async () => {
    let stream = createDEPPStream();

    let results = await annuaire.initialize(
      stream,
      apiEntrepriseMock({
        siege_social: true,
        date_creation_etablissement: 1606431600,
        etat_administratif: {
          value: "A",
          date_fermeture: null,
        },
      })
    );

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
      sirene: {
        siegeSocial: true,
        dateCreation: new Date("2020-11-26T23:00:00.000Z"),
        statut: "actif",
      },
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      invalid: 0,
      ignored: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on ignore les établissements en double lors de l'initialisation", async () => {
    let stream = createDEPPStream(`"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"
"0011058V";"11111111111111";"Centre de formation"`);

    let results = await annuaire.initialize(stream, apiEntrepriseMock());

    await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(results, {
      total: 1, // Filtered
      inserted: 1,
      invalid: 0,
      ignored: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut supprimer un annuaire", async () => {
    await createAnnuaire({
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
    }).save();

    await annuaire.deleteAll();

    let count = await Annuaire.countDocuments();
    assert.strictEqual(count, 0);
  });

  it("Vérifie qu'on peut ignore un établissement avec un siret vide dans le fichier de la DEPP", async () => {
    let stream = createStream(`"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"";"Centre de formation"`);

    let results = await annuaire.initialize(stream, apiEntrepriseMock());

    let count = await Annuaire.countDocuments({ siret: "11111111111111" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 0,
      invalid: 1,
      ignored: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on pet collecter un uai", async () => {
    let stream = createStream(
      `"code UAI";"n° SIRET";"nom"
"0011073L";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let results = await annuaire.collectUAIs("onisep", stream);

    let found = await Annuaire.findOne({}, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      sirene: {
        siegeSocial: true,
        dateCreation: new Date("2020-11-26T23:00:00.000Z"),
        statut: "actif",
      },
      uais_secondaires: [
        {
          type: "onisep",
          uai: "0011073L",
          valide: true,
        },
      ],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie qu'on teste la validité d'un UAI", async () => {
    let stream = createStream(
      `"code UAI";"n° SIRET";"nom"
"093XXXT";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let results = await annuaire.collectUAIs("onisep", stream);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires[0], {
      type: "onisep",
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
    let stream = createStream(
      `"code UAI";"n° SIRET";"nom"
"0011058V";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let stats = await annuaire.collectUAIs("onisep", stream);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe déjà en tant qu'uai secondaire", async () => {
    let stream = createStream(
      `"code UAI";"n° SIRET";"nom"
"0011073L";"11111111111111";"Centre de formation"`
    );
    await createAnnuaire({
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [
        {
          type: "onisep",
          uai: "0011073L",
          valide: true,
        },
      ],
    }).save();

    let stats = await annuaire.collectUAIs("onisep", stream);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, [
      {
        type: "onisep",
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
    let stream = createStream(
      `uai;siret;nom
"";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let stats = await annuaire.collectUAIs("onisep", stream);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found.uais_secondaires, []);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier ONISEP", async () => {
    let stream = createStream(
      `"code UAI";"n° SIRET";"nom"
"0011073L";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let results = await annuaire.collectUAIs("onisep", stream);

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
    let stream = createStream(
      `STRUCT SIRET;STRUCT UAI;STRUCT Libellé Amétys
"11111111111111";"0011073L";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let results = await annuaire.collectUAIs("onisepStructure", stream);

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
    let stream = createStream(
      `uai_code_siret;uai_code_educnationale;uai_libelle_educnationale
"11111111111111";"0011073L";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let results = await annuaire.collectUAIs("refea", stream);

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
    await new Etablissement({
      uai: "0011073L",
      siret: "11111111111111",
      entreprise_raison_sociale: "Centre de formation",
    }).save();

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let results = await annuaire.collectUAIs("catalogue");

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
    let stream = createStream(
      `SIRET CFA;N UAI CFA;Nom CFA
"11111111111111";"0011073L";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream(), apiEntrepriseMock());
    let results = await annuaire.collectUAIs("opcoep", stream);

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
});
