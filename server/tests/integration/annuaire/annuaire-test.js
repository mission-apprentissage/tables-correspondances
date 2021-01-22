const assert = require("assert");
const csv = require("csv-parse");
const { oleoduc, transformData } = require("oleoduc");
const { omit } = require("lodash");
const { Etablissement, Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const annuaire = require("../../../src/jobs/annuaire/annuaire");
const { createSource } = require("../../../src/jobs/annuaire/sources/sources");
const { createAnnuaire } = require("../../utils/fixtures");
const { raw } = require("../../../src/common/utils/mongooseUtils");

const { createStream } = require("../../utils/testUtils");

integrationTests(__filename, () => {
  const createDEPPStream = (content) => {
    return createStream(
      content ||
        `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"11111111111111";"Centre de formation"`
    );
  };

  const createTestSource = (content) => {
    return oleoduc(
      createStream(content),
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
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      inserted: 1,
      invalid: 0,
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
    let source = createStream(`"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"0011058V";"";"Centre de formation"`);

    let results = await annuaire.initialize(source);

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
    let source = createTestSource(
      `uai;siret;nom
"0011073L";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("test", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [
        {
          type: "test",
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
    let source = createTestSource(
      `uai;siret;nom
"093XXXT";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("test", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(found.toObject().uais_secondaires[0], {
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
    let source = createTestSource(
      `uai;siret;nom
"0011058V";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let stats = await annuaire.collect("test", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
    });
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on ignore un uai quand il existe déjà en tant qu'uai secondaire", async () => {
    let source = createTestSource(
      `uai;siret;nom
"0011073L";"11111111111111";"Centre de formation"`
    );
    await createAnnuaire({
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [
        {
          type: "test",
          uai: "0011073L",
          valide: true,
        },
      ],
    }).save();

    let stats = await annuaire.collect("test", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [
        {
          type: "test",
          uai: "0011073L",
          valide: true,
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
    let source = createTestSource(
      `uai;siret;nom
"";"11111111111111";"Centre de formation"`
    );

    await annuaire.initialize(createDEPPStream());
    let stats = await annuaire.collect("test", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
    });
    assert.deepStrictEqual(stats, {
      total: 1,
      failed: 0,
      updated: 0,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier ONISEP", async () => {
    let source = createSource("onisep", {
      stream: createStream(
        `"code UAI";"n° SIRET";"nom"
"0011073L";"11111111111111";"Centre de formation"`
      ),
    });

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("onisep", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
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
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier ONISEP (structure)", async () => {
    let source = createSource("onisep-structure", {
      stream: createStream(
        `STRUCT SIRET;STRUCT UAI;STRUCT Libellé Amétys
"11111111111111";"0011073L";"Centre de formation"`
      ),
    });

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("onisep-structure", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [
        {
          type: "onisep-structure",
          uai: "0011073L",
          valide: true,
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
    let source = createSource("refea", {
      stream: createStream(
        `uai_code_siret;uai_code_educnationale;uai_libelle_educnationale
"11111111111111";"0011073L";"Centre de formation"`
      ),
    });

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("refea", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [
        {
          type: "refea",
          uai: "0011073L",
          valide: true,
        },
      ],
    });
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

    let source = createSource("catalogue");

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("catalogue", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [
        {
          type: "catalogue",
          uai: "0011073L",
          valide: true,
        },
      ],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      updated: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut collecter des informations du fichier OPCO EP", async () => {
    let source = createSource("opcoep", {
      stream: createStream(
        `SIRET CFA;N UAI CFA;Nom CFA
"11111111111111";"0011073L";"Centre de formation"`
      ),
    });

    await annuaire.initialize(createDEPPStream());
    let results = await annuaire.collect("opcoep", source);

    let found = await Annuaire.findOne();
    assert.deepStrictEqual(omit(raw(found), ["_id"]), {
      uai: "0011058V",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [
        {
          type: "opcoep",
          uai: "0011073L",
          valide: true,
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
