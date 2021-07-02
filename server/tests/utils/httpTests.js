/* eslint-disable node/no-unpublished-require */
const axiosist = require("axiosist");
const createComponents = require("../../src/common/components/components");
const computeStats = require("../../src/jobs/annuaire/computeStats");
const { connectToMongoForTests, cleanAll, createStream } = require("./testUtils.js");
const server = require("../../src/http/server");

// eslint-disable-next-line no-unused-vars
async function startServer() {
  const { db } = await connectToMongoForTests();
  const components = await createComponents({ db });
  const app = await server(components);
  const httpClient = axiosist(app);

  return {
    httpClient,
    components,
    async createAndLogUser(username, password, options) {
      await components.users.createUser(username, password, options);

      const response = await httpClient.post("/api/login", {
        username: username,
        password: password,
      });

      return {
        Authorization: "Bearer " + response.data.token,
      };
    },
    computeStats(content) {
      return computeStats({
        referentiels: [
          {
            name: "datagouv",
            stream: () => {
              return createStream(content || "11111111111111");
            },
          },
        ],
      });
    },
  };
}

module.exports = (desc, cb) => {
  describe(desc, function () {
    cb({ startServer });
    afterEach(cleanAll);
  });
};
