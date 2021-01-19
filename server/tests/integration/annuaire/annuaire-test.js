const assert = require("assert");
const csv = require("csv-parse");
const { oleoduc, transformData } = require("oleoduc");
const { omit } = require("lodash");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const annuaire = require("../../../src/jobs/annuaire/annuaire");
const { createStream } = require("../../utils/testUtils");

integrationTests(__filename, () => {
  const createDEPPStream = (content) => {
    return createStream(
      content ||
        `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`
    );
  };

  const createDummyParser = () => {
    //Works with a fake CSV file with the following columns
    //uai;siret;nom
    return oleoduc(
      csv({
        delimiter: ";",
        columns: true,
      }),
      transformData((data) => {
        return {
          siret: data.siret,
          uai: data.uai,
          nom: data.nom,
        };
      })
    );
  };

  it("Vérifie qu'on peut initialiser un annuaire avec le fichier de la DEPP", async () => {
    let stream = createDEPPStream();

    let results = await annuaire.initialize(stream);

    let found = await Annuaire.findOne({ siret: "11111111111111" });
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "0011058V",
          valid: true,
        },
      ],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      invalid: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut supprimer un annuaire", async () => {
    await new Annuaire({
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [],
    }).save();

    await annuaire.deleteAll();

    let count = await Annuaire.countDocuments();
    assert.strictEqual(count, 0);
  });

  it("Vérifie qu'on peut ignore un établissement avec un siret vide dans le fichier de la DEPP", async () => {
    let { initialize } = annuaire;
    let stream = createDEPPStream(`"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"";"Centre de formation"`);

    let results = await initialize(stream);

    let count = await Annuaire.countDocuments({ siret: "11111111111111" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 0,
      invalid: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on ajoute un uai quand il n'existe pas", async () => {
    let source = createStream(
      `uai;siret;nom
"0011073L";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "0011058V",
          valid: true,
        },
        {
          type: "dummy",
          uai: "0011073L",
          valid: true,
        },
      ],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie qu'on teste la validaté d'un UAI", async () => {
    let source = createStream(
      `uai;siret;nom
"093XXXT";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(found.toObject().uais[1], {
      type: "dummy",
      uai: "093XXXT",
      valid: false,
    });
    assert.deepStrictEqual(results, {
      total: 1,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe en tant qu'uai principal", async () => {
    let source = createStream(
      `uai;siret;nom
"0011058V";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let stats = await annuaire.collect("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "0011058V",
          valid: true,
        },
      ],
    });
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe déjà en tant qu'uai secondaire", async () => {
    let source = createStream(
      `uai;siret;nom
"0011073L";"11111111111111";"Centre de formation"`
    );
    new Annuaire({
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "0011058V",
          valid: true,
        },
        {
          type: "dummy",
          uai: "0011073L",
          valid: true,
        },
      ],
    }).save();

    let stats = await annuaire.collect("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "0011058V",
          valid: true,
        },
        {
          type: "dummy",
          uai: "0011073L",
          valid: true,
        },
      ],
    });
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai vide", async () => {
    let source = createStream(
      `uai;siret;nom
"";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let stats = await annuaire.collect("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "0011058V",
          valid: true,
        },
      ],
    });
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier ONISEP", async () => {
    let source = createStream(
      `"code UAI";"n° SIRET";"nom"
"0011073L";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("onisep", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "0011058V",
          valid: true,
        },
        {
          type: "onisep",
          uai: "0011073L",
          valid: true,
        },
      ],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier REFEA", async () => {
    let source = createStream(
      `uai_code_siret;uai_code_educnationale;uai_libelle_educnationale
"11111111111111";"0011073L";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("refea", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "0011058V",
          valid: true,
        },
        {
          type: "refea",
          uai: "0011073L",
          valid: true,
        },
      ],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });
});
