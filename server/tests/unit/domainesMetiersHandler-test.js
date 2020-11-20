const assert = require("assert");
const { getRomesAndLabelsFromTitleQuery } = require("../../src/logic/handlers/domainesMetiersHandler");

describe(__filename, () => {
  it("Renvoi un tableau de libellé et de code rome", () => {
    const result = await getRomesAndLabelsFromTitleQuery("coiffeur");
    assert.strictEqual(result, typeof result === "array");
  });
  
});
