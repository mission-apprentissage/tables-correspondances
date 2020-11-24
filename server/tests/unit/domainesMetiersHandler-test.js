const assert = require("assert");
const { getRomesAndLabelsFromTitleQuery } = require("../../src/logic/handlers/domainesMetiersHandler");

describe(__filename, () => {
  it("Renvoi un tableau de libellé et de code rome", async () => {
    const result = await getRomesAndLabelsFromTitleQuery("coiffeur");
    assert.strictEqual(result.labelsAndRomes, []);
  });
});
