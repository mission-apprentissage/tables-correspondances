const assert = require("assert");
const { getRomesAndLabelsFromTitleQuery } = require("../../src/logic/handlers/domainesMetiersHandler");

const fakeEsClient = {
  search: () => ({
    body: {
      hits: {
        hits: [
          {
            _source: {
              sous_domaine: "sous domaine",
              codes_romes: ["a", "b", "c"],
            },
          },
        ],
      },
    },
  }),
};

describe(__filename, () => {
  it("Renvoi un tableau de libellé et de code rome", async () => {
    const result = await getRomesAndLabelsFromTitleQuery({ title: "coiffeur" }, fakeEsClient);
    assert.strictEqual(Array.isArray(result?.labelsAndRomes), true);
  });
});
