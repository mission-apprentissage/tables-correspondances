const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
const annuaire = require("../../../src/jobs/annuaire/annuaire");
const { createStream } = require("../../utils/testUtils");

integrationTests(__filename, () => {
  it.only("Vérifie qu'on ajoute un uai secondaire quand different de celui de base (ONISEP)", async () => {
    let { build } = annuaire;
    let stream = createStream(
      `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"093111T";"11111111111111";"Centre de formation"`
    );

    let results = await build(stream, [
      {
        type: "onisep",
        stream: createStream(
          `"code UAI";"n° SIRET";"nom"
"093222T";"11111111111111";"Centre de formation"`
        ),
      },
    ]);

    assert.deepStrictEqual(results, {
      etablissements: [
        {
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
        },
      ],
      stats: {
        onisep: {
          total: 1,
          same: 0,
          updated: 1,
          missing: 0,
        },
      },
    });
  });

  it.only("Vérifie que quand l'uai est le même alors on n'ajoute pas d'uai secondaire", async () => {
    let { build } = annuaire;
    let stream = createStream(
      `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"093111T";"11111111111111";"Centre de formation"`
    );

    let results = await build(stream, [
      {
        type: "onisep",
        stream: createStream(
          `"code UAI";"n° SIRET";"nom"
"093111T";"11111111111111";"Centre de formation"`
        ),
      },
    ]);

    assert.deepStrictEqual(results, {
      etablissements: [
        {
          uai: "093111T",
          siret: "11111111111111",
          nom: "Centre de formation",
          uais: [
            {
              type: "depp",
              uai: "093111T",
            },
          ],
        },
      ],
      stats: {
        onisep: {
          total: 1,
          same: 1,
          updated: 0,
          missing: 0,
        },
      },
    });
  });

  it.only("Vérifie qu'on ignore un uai vide", async () => {
    let { build } = annuaire;
    let stream = createStream(
      `"numero_uai";"numero_siren_siret_uai";"patronyme_uai"
"093111T";"11111111111111";"Centre de formation"`
    );

    let results = await build(stream, [
      {
        type: "onisep",
        stream: createStream(
          `"code UAI";"n° SIRET";"nom"
"";"11111111111111";"Centre de formation"`
        ),
      },
    ]);

    assert.deepStrictEqual(results, {
      etablissements: [
        {
          uai: "093111T",
          siret: "11111111111111",
          nom: "Centre de formation",
          uais: [
            {
              type: "depp",
              uai: "093111T",
            },
          ],
        },
      ],
      stats: {
        onisep: {
          total: 1,
          same: 0,
          updated: 0,
          missing: 1,
        },
      },
    });
  });
});
