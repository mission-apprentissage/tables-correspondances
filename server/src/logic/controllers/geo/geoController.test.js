/**
 * Example of unit testing a logic module
 */
const assert = require("assert");
const geoController = require("./geoController");

describe(__filename, () => {
  it("isValidCodePostal", () => {
    assert.strictEqual(geoController.isValidCodePostal(24000), true);
    assert.strictEqual(geoController.isValidCodePostal(44000), true);
    assert.strictEqual(geoController.isValidCodePostal("45A02"), false);
    assert.strictEqual(geoController.isValidCodePostal(999999999), false);
  });

  it("findDataByDepartementNum", () => {
    assert.strictEqual(geoController.findDataByDepartementNum("2A")?.nom_dept, "Corse-du-Sud");
    assert.strictEqual(geoController.findDataByDepartementNum("2B")?.nom_dept, "Haute-Corse");
    assert.strictEqual(geoController.findDataByDepartementNum("974")?.nom_dept, "La Réunion");
  });
});
