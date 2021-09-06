const assert = require("assert");
const { Readable } = require("stream");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/tasks/collectSources");
const { importReferentiel } = require("../../../utils/testUtils");

function createAcceSource(array = {}) {
  let ndjson = array.map((i) => `${JSON.stringify(i)}\n`);

  return createSource("acce", {
    input: Readable.from(ndjson),
  });
}

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des relations (siret)", async () => {
    await importReferentiel();
    let source = createAcceSource([
      {
        uai: "0111111Y",
        siret: "11111111100006",
        rattachements: {
          fille: [
            {
              uai: "0222222W",
              siret: "22222222200002",
              sigle: "FORMATION",
              patronyme: "FILLE FORMATION",
              nature: "Section d'enseignement général et professionnel adapté",
              commune: "Clermont-Ferrand",
            },
          ],
          mere: [
            {
              uai: "0333333U",
              siret: "33333333300003",
              sigle: "FORMATION",
              patronyme: "MERE FORMATION",
              nature: "Section d'enseignement général et professionnel adapté",
              commune: "Clermont-Ferrand",
            },
          ],
        },
      },
    ]);

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.relations, [
      {
        sources: ["acce"],
        label: "FILLE FORMATION",
        siret: "22222222200002",
        type: "fille",
        annuaire: false,
      },
      {
        sources: ["acce"],
        siret: "33333333300003",
        label: "MERE FORMATION",
        type: "mère",
        annuaire: false,
      },
    ]);
    assert.deepStrictEqual(stats, {
      acce: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des contacts", async () => {
    await importReferentiel();
    let source = createAcceSource([
      {
        uai: "0111111Y",
        siret: "11111111100006",
        email: "jacques@dupont.fr",
        rattachements: { fille: [], mere: [] },
      },
    ]);

    let stats = await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.contacts, [
      {
        email: "jacques@dupont.fr",
        sources: ["acce"],
      },
    ]);
    assert.deepStrictEqual(stats, {
      acce: {
        total: 1,
        updated: 1,
        ignored: 0,
        failed: 0,
      },
    });
  });
});
