const { connectToMongoForTests, cleanAll } = require("./testUtils.js");

module.exports = (desc, cb) => {
  describe(desc, function () {
    let context;

    beforeEach(async function () {
      const { db } = await connectToMongoForTests();
      context = { db };
    });

    cb({ getContext: () => context });

    afterEach(cleanAll);
  });
};
