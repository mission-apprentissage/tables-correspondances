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

  it("Vérifie qu'on ajoute un uai quand il est different de celui de base", async () => {
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
      missing: 0,
      failed: 0,
      updated: 1,
    });
  });

  it("Vérifie que quand l'uai est le même alors on n'ajoute pas l'uai", async () => {
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
      missing: 0,
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
      missing: 1,
    });
  });

  it("Vérifie qu'on indique si l'établissement est inconnu", async () => {
    let source = createStream(
      `uai;siret;nom
"093333T";"33333333333333";"Centre de formation"`
    );

    await annuaire.reset(createDEPPStream());
    let stats = await annuaire.addUAIs("dummy", source, createDummyParser());

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(found.toObject().uais, [
      {
        type: "depp",
        uai: "093111T",
      },
    ]);
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
      missing: 1,
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
      missing: 0,
      failed: 0,
      updated: 1,
    });
  });
});
