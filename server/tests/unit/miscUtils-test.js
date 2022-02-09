/**
 * Example of unit testing a logic module
 */
const assert = require("assert");
const { trimObjValues, trimObjKeys, trimObjEntries } = require("../../src/common/utils/miscUtils");

const data = {
  " key ": " value ",
};

const dataTrimmedKeys = {
  key: " value ",
};

const dataTrimmedValues = {
  " key ": "value",
};

const dataTrimmedEntries = {
  key: "value",
};

describe(__filename, () => {
  it("trimObjKeys fonctionne", () => {
    assert.deepEqual(trimObjKeys({ ...data }), dataTrimmedKeys);
  });

  it("trimObjValues fonctionne", () => {
    assert.deepEqual(trimObjValues({ ...data }), dataTrimmedValues);
  });

  it("trimObjEntries fonctionne", () => {
    assert.deepEqual(trimObjEntries({ ...data }), dataTrimmedEntries);
  });
});
