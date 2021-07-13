const assert = require("assert");
const { omit } = require("lodash");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const importReferentiel = require("../../../../src/jobs/annuaire/importReferentiel");
const { createReferentiel } = require("../../../../src/jobs/annuaire/referentiels/referentiels");
const { createStream } = require("../../../utils/testUtils");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut ajouter le référentiel datagouv", async () => {
    let referentiel = await createReferentiel("datagouv", {
      input: createStream(`"siren";"num_etablissement";"cfa"
"111111111";"00006";"Oui"
"222222222";"00002";"Non"`),
    });

    let results = await importReferentiel(referentiel);

    let docs = await Annuaire.find({}, { _id: 0 }).lean();
    assert.strictEqual(docs.length, 1);
    assert.deepStrictEqual(omit(docs[0], ["_meta"]), {
      siret: "11111111100006",
      referentiels: ["datagouv"],
      uais: [],
      reseaux: [],
      relations: [],
      lieux_de_formation: [],
      diplomes: [],
      certifications: [],
    });
    assert.deepStrictEqual(results, {
      total: 1,
      created: 1,
      updated: 0,
      failed: 0,
    });
  });
});
