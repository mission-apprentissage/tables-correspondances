const assert = require("assert");
const { oleoduc, transformData } = require("oleoduc");
const { Readable } = require("stream");
const integrationTests = require("../../utils/integrationTests");
const buildMatrice = require("../../../src/jobs/annuaire/buildMatrice");

integrationTests(__filename, () => {
  function createTestSource(array, options = {}) {
    let name = options.name || "dummy";
    return {
      name,
      stream() {
        return oleoduc(
          Readable.from(array),
          transformData((d) => ({ from: name, ...d })),
          { promisify: false }
        );
      },
    };
  }

  it("Vérifie qu'on construire une matrice", async () => {
    let source1 = createTestSource(
      [
        {
          selector: "11111111100006",
          uais: ["1234567W"],
        },
        {
          selector: "22222222200002",
          uais: ["1234567W"],
        },
        {
          selector: "11111111100006",
          uais: ["1234567W"],
        },
      ],
      { name: "source1" }
    );
    let source2 = createTestSource(
      [
        {
          selector: "11111111100006",
          uais: ["1234567W"],
        },
      ],
      { name: "source2" }
    );

    let matrice = await buildMatrice([source1, source2], ["siret"]);
    assert.deepStrictEqual(matrice, {
      source1: { source1: { intersection: 2, union: 2 }, source2: { intersection: 1, union: 2 } },
      source2: { source1: { intersection: 1, union: 2 }, source2: { intersection: 1, union: 1 } },
    });

    matrice = await buildMatrice([source1, source2], ["uai"]);
    assert.deepStrictEqual(matrice, {
      source1: { source1: { intersection: 1, union: 1 }, source2: { intersection: 1, union: 1 } },
      source2: { source1: { intersection: 1, union: 1 }, source2: { intersection: 1, union: 1 } },
    });

    matrice = await buildMatrice([source1, source2], ["uai", "siret"]);
    assert.deepStrictEqual(matrice, {
      source1: { source1: { intersection: 2, union: 2 }, source2: { intersection: 1, union: 2 } },
      source2: { source1: { intersection: 1, union: 2 }, source2: { intersection: 1, union: 1 } },
    });
  });
});
