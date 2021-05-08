const assert = require("assert");
const { AnnuaireStats } = require("../../../src/common/model");
const { createStream } = require("../../utils/testUtils");
const integrationTests = require("../../utils/integrationTests");
const computeStats = require("../../../src/jobs/annuaire/computeStats");
const { insertAnnuaire } = require("../../utils/fixtures");

function createFakeReferentiel(content) {
  return {
    name: "dgefp",
    stream: () => {
      return createStream(content || "11111111111111");
    },
  };
}

integrationTests(__filename, () => {
  it("Vérifie qu'on peut calculer les stats de l'annuaire", async () => {
    await Promise.all([
      insertAnnuaire({ siret: "11111111100001", gestionnaire: true }),
      insertAnnuaire({ siret: "11111111100002", formateur: true }),
      insertAnnuaire({ siret: "11111111100003", gestionnaire: true, formateur: true }),
      insertAnnuaire({ siret: "22222222200001", formateur: true, academie: { code: "10", nom: "Lyon" } }),
    ]);

    let results = await computeStats({
      referentiels: [createFakeReferentiel()],
    });

    let found = await AnnuaireStats.findOne({}, { _id: 0, created_at: 0 }).lean();
    let stats = {
      referentiels: [{ name: "dgefp", nbSirens: 1, nbSirets: 1 }],
      globale: {
        nbSirens: 2,
        nbSirets: 4,
        nbSiretsGestionnairesEtFormateurs: 1,
        nbSiretsGestionnaires: 1,
        nbSiretsFormateurs: 2,
        nbSiretsSansUAIs: 4,
        nbSiretsAvecPlusieursUAIs: 0,
      },
      academies: [
        {
          academie: {
            code: "10",
            nom: "Lyon",
          },
          nbSirens: 1,
          nbSirets: 1,
          nbSiretsGestionnairesEtFormateurs: 0,
          nbSiretsGestionnaires: 0,
          nbSiretsFormateurs: 1,
          nbSiretsSansUAIs: 1,
          nbSiretsAvecPlusieursUAIs: 0,
        },
        {
          academie: {
            code: "01",
            nom: "Paris",
          },
          nbSirens: 1,
          nbSirets: 3,
          nbSiretsGestionnairesEtFormateurs: 1,
          nbSiretsGestionnaires: 1,
          nbSiretsFormateurs: 1,
          nbSiretsSansUAIs: 3,
          nbSiretsAvecPlusieursUAIs: 0,
        },
      ],
    };
    assert.deepStrictEqual(found, stats);
    assert.deepStrictEqual(results, stats);
  });
});
