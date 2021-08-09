const assert = require("assert");

const { findRegionByUai, findRegionByName } = require("../../src/jobs/annuaire/utils/regions");

describe(__filename, () => {
  it("Permet de trouver une région avec son UAI", () => {
    assert.deepStrictEqual(findRegionByUai("0751234J").nom, "Île-de-France");
    assert.deepStrictEqual(findRegionByUai("6200001G").nom, "Corse");
    assert.deepStrictEqual(findRegionByUai("9871234J").nom, "Collectivités d'outre-mer");
    assert.deepStrictEqual(findRegionByUai("UNKNOWN"), null);
  });

  it("Permet de trouver une région avec son nom", () => {
    assert.deepStrictEqual(findRegionByName("Île-de-France").code, "11");
  });
});
