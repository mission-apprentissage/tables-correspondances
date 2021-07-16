const assert = require("assert");

const { findAcademieByUai, findAcademieByName } = require("../../src/jobs/annuaire/utils/academies");

describe(__filename, () => {
  it("Permet de trouver une région avec son UAI", () => {
    assert.deepStrictEqual(findAcademieByUai("0751234J").nom, "Paris");
    assert.deepStrictEqual(findAcademieByUai("6200001G").nom, "Corse");
    assert.deepStrictEqual(findAcademieByUai("9871234J").nom, "Polynésie Française");
    assert.deepStrictEqual(findAcademieByUai("UNKNOWN"), null);
  });

  it("Permet de trouver une académie avec son nom", () => {
    assert.deepStrictEqual(findAcademieByName("Paris").code, "01");
  });
});
