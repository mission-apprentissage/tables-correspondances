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
"093111T";"11111111111111";"Centre de formation"`
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

  it("Vérifie qu'on peut réinitialiser un annuaire avec le fichier de la DEPP", async () => {
    let { reset } = annuaire;
    let stream = createDEPPStream();

    let results = await reset(stream);

    let found = await Annuaire.findOne({ siret: "11111111111111" });
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "093111T",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "093111T",
        },
      ],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on ajoute un uai quand il n'existe pas", async () => {
    let source = createStream(
      `uai;siret;nom
"093222T";"11111111111111";"Centre de formation"`
    );

    await annuaire.reset(createDEPPStream());
    let results = await annuaire.addUAIs("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "093111T",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "093111T",
        },
        {
          type: "dummy",
          uai: "093222T",
        },
      ],
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
"093111T";"11111111111111";"Centre de formation"`
    );

    await annuaire.reset(createDEPPStream());
    let stats = await annuaire.addUAIs("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "093111T",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "093111T",
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
"093222T";"11111111111111";"Centre de formation"`
    );
    new Annuaire({
      uai: "093111T",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "093111T",
        },
        {
          type: "dummy",
          uai: "093222T",
        },
      ],
    }).save();

    let stats = await annuaire.addUAIs("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "093111T",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "093111T",
        },
        {
          type: "dummy",
          uai: "093222T",
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

    await annuaire.reset(createDEPPStream());
    let stats = await annuaire.addUAIs("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "093111T",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "093111T",
        },
      ],
    });
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on peut importer le fichier ONISEP", async () => {
    let source = createStream(
      `"code UAI";"n° SIRET";"nom"
"093222T";"11111111111111";"Centre de formation"`
    );

    await annuaire.reset(createDEPPStream());
    let results = await annuaire.addUAIs("onisep", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(found.toObject(), ["__v", "_id"]), {
      uai: "093111T",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais: [
        {
          type: "depp",
          uai: "093111T",
        },
        {
          type: "onisep",
          uai: "093222T",
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
