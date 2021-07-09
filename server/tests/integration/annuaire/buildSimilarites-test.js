const assert = require("assert");
const { oleoduc, transformData } = require("oleoduc");
const { Readable } = require("stream");
const integrationTests = require("../../utils/integrationTests");
const buildSimilarites = require("../../../src/jobs/annuaire/buildSimilarites");

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

  it("Vérifie qu'on trouve les similarités entre les sources", async () => {
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
          selector: "22222222200002",
          uais: [],
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

    let res = await buildSimilarites([source1, source2], ["uai", "siret"]);
    assert.deepStrictEqual(res, { "1": 2, "2": 1, total: 3 });
  });
});
