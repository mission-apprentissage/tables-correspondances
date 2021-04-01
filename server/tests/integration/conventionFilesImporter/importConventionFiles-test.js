const assert = require("assert");
const { ConventionFile } = require("../../../src/common/model");
const importConventionFiles = require("../../../src/jobs/conventionFilesImporter/importConventionFiles");
const integrationTests = require("../../utils/integrationTests");
const { createStream } = require("../../utils/testUtils");

function getStream() {
  return createStream(`"siren";"num_etablissement";"cfa"
"111111111";"11111";"Oui"`);
}

integrationTests(__filename, () => {
  it("Vérifie qu'on peut importer tous les fichiers", async () => {
    await importConventionFiles({ getStream });

    let count = await ConventionFile.countDocuments();
    assert.strictEqual(count, 4);
  });

  it("Vérifie qu'on import le fichier DATADOCK", async () => {
    await importConventionFiles({ getStream });

    let found = await ConventionFile.findOne({ type: "DATADOCK" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      siren: "111111111",
      num_etablissement: "11111",
      cfa: "Oui",
      type: "DATADOCK",
    });
  });

  it("Vérifie qu'on import le fichier DEPP", async () => {
    await importConventionFiles({ getStream });

    let found = await ConventionFile.findOne({ type: "DEPP" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      siren: "111111111",
      num_etablissement: "11111",
      cfa: "Oui",
      type: "DEPP",
    });
  });

  it("Vérifie qu'on import le fichier DGEFP", async () => {
    await importConventionFiles({ getStream });

    let found = await ConventionFile.findOne({ type: "DGEFP" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      siren: "111111111",
      num_etablissement: "11111",
      cfa: "Oui",
      type: "DGEFP",
    });
  });

  it("Vérifie qu'on import le fichier DATAGOUV", async () => {
    await importConventionFiles({ getStream });

    let found = await ConventionFile.findOne({ type: "DATAGOUV" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      siren: "111111111",
      num_etablissement: "11111",
      cfa: "Oui",
      type: "DATAGOUV",
    });
  });
});
