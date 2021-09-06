const assert = require("assert");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { insertAnnuaire } = require("../../utils/fixtures");
const consolidate = require("../../../src/jobs/annuaire/tasks/consolidate");
const { omit } = require("lodash");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut valider un UAI", async () => {
    await insertAnnuaire({
      siret: "11111111100006",
      uais: [
        {
          sources: ["deca", "sifa-ramsese"],
          uai: "0111111Y",
          valide: true,
        },
      ],
    });

    let stats = await consolidate();

    let found = await Annuaire.findOne().lean();
    assert.deepStrictEqual(found.uai, "0111111Y");
    assert.deepStrictEqual(stats, {
      validateUAI: {
        validated: 1,
        conflicted: 0,
      },
    });
  });

  it("Vérifie qu'on détecte un UAI en conflict", async () => {
    await Promise.all([
      insertAnnuaire(
        {
          siret: "11111111100006",
          uais: [
            {
              sources: ["deca", "sifa-ramsese"],
              uai: "0111111Y",
              valide: true,
            },
          ],
        },
        insertAnnuaire({
          siret: "22222222200022",
          uais: [
            {
              sources: ["deca", "sifa-ramsese"],
              uai: "0111111Y",
              valide: true,
            },
          ],
        })
      ),
    ]);

    let stats = await consolidate();

    let found = await Annuaire.findOne({ siret: "22222222200022" }).lean();
    assert.ok(!found.uai);
    assert.deepStrictEqual(
      found._meta.anomalies.map((a) => omit(a, ["date"])),
      [
        {
          code: "conflit_uai",
          details: "UAI 0111111Y en conflict avec 1 autres établissements",
          job: "consolidate",
          source: "annuaire",
        },
      ]
    );
    assert.deepStrictEqual(stats, {
      validateUAI: {
        validated: 0,
        conflicted: 2,
      },
    });
  });

  it("Vérifie qu'on peut ignorer les établissements qui ne peuvent pas être validé", async () => {
    await insertAnnuaire({
      siret: "11111111100006",
      uais: [
        {
          sources: ["deca"],
          uai: "0111111Y",
          valide: true,
        },
      ],
    });

    let stats = await consolidate();

    let found = await Annuaire.findOne().lean();
    assert.ok(!found.uai);
    assert.deepStrictEqual(stats, {
      validateUAI: {
        validated: 0,
        conflicted: 0,
      },
    });
  });
});
