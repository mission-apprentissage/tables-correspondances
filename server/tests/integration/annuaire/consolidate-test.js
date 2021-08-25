const assert = require("assert");
const { Annuaire } = require("../../../src/common/model");
const integrationTests = require("../../utils/integrationTests");
const { insertAnnuaire } = require("../../utils/fixtures");
const consolidate = require("../../../src/jobs/annuaire/consolidate");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut valider un UAI", async () => {
    await insertAnnuaire({
      siret: "11111111100006",
      uais: [
        {
          sources: ["deca", "sifa-ramsese"],
          uai: "0751234J",
          valide: true,
        },
      ],
    });

    let stats = await consolidate();

    let found = await Annuaire.findOne().lean();
    assert.deepStrictEqual(found.uai, "0751234J");
    assert.deepStrictEqual(stats, {
      validateUAI: {
        validated: 1,
        removed: 0,
        conflicted: 0,
      },
    });
  });

  it("Vérifie que quand un UAI est validé alors il est supprimé dans les autres établissements", async () => {
    await Promise.all([
      insertAnnuaire({
        siret: "11111111100006",
        uais: [
          {
            sources: ["deca", "sifa-ramsese"],
            uai: "0751234J",
            valide: true,
          },
        ],
      }),
      insertAnnuaire({
        siret: "22222222200022",
        uais: [
          {
            sources: ["deca", "sifa-ramsese"],
            uai: "0011073X",
            valide: true,
          },
          {
            sources: ["deca", "other"],
            uai: "0751234J",
            valide: true,
          },
        ],
      }),
      insertAnnuaire({
        siret: "33333333300008",
        uais: [
          {
            sources: ["other"],
            uai: "1234567Z",
            valide: true,
          },
        ],
      }),
    ]);

    let stats = await consolidate();

    let found = await Annuaire.findOne({ siret: "11111111100006" }).lean();
    assert.deepStrictEqual(found.uai, "0751234J");

    found = await Annuaire.findOne({ siret: "22222222200022" }).lean();
    assert.deepStrictEqual(found.uai, "0011073X");
    assert.strictEqual(
      found.uais.find((u) => u.uai === "0751234J"),
      undefined
    );
    assert.deepStrictEqual(stats, {
      validateUAI: {
        validated: 2,
        removed: 1,
        conflicted: 0,
      },
    });
  });

  it("Vérifie qu'on détecte un UAI est en conflict", async () => {
    await Promise.all([
      insertAnnuaire(
        {
          siret: "11111111100006",
          uais: [
            {
              sources: ["deca", "sifa-ramsese"],
              uai: "0751234J",
              valide: true,
            },
          ],
        },
        insertAnnuaire({
          siret: "22222222200022",
          uais: [
            {
              sources: ["deca", "sifa-ramsese"],
              uai: "0751234J",
              valide: true,
            },
          ],
        }),
        insertAnnuaire({
          siret: "33333333300008",
          uais: [
            {
              sources: ["deca", "sifa-ramsese"],
              uai: "0011073X",
              valide: true,
            },
          ],
        })
      ),
    ]);

    let stats = await consolidate();

    let found = await Annuaire.findOne({ siret: "22222222200022" }).lean();
    assert.ok(!found.uai);
    assert.deepStrictEqual(stats, {
      validateUAI: {
        validated: 1,
        removed: 0,
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
          uai: "0751234J",
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
        removed: 0,
        conflicted: 0,
      },
    });
  });
});
