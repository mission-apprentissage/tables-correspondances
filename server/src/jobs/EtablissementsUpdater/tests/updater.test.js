const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const { Etablissement } = require("../../../common/model/index");
const { connectToMongoForTests, cleanAll } = require("../../../../tests/utils/testUtils.js");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { performUpdates } = require("../updater/updater.js");

const EtablissementsTest = fs.readJsonSync(path.resolve(__dirname, "../assets/sample.json"));

describe(__filename, () => {
  before(async () => {
    // Connection to test collection
    await connectToMongoForTests();
    await Etablissement.deleteMany({});

    // insert sample data in DB
    await asyncForEach(EtablissementsTest, async (etablissement) => await new Etablissement(etablissement).save());
  });

  after(async () => {
    await cleanAll();
  });

  it("should have inserted sample data", async () => {
    const count = await Etablissement.countDocuments({});
    assert.strictEqual(count, 1);
  });

  it("should have updated data with etablissement service call", async () => {
    await performUpdates(Etablissement, {});

    const count = await Etablissement.countDocuments({});
    assert.strictEqual(count, 1);
  });
});
