const { strictEqual, deepStrictEqual } = require("assert");
const httpTests = require("../../utils/httpTests");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut s'assurer qu'un uai est valide", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/uai/0010856A");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      code: "0010856A",
    });
  });

  it("Vérifie qu'on peut s'assurer qu'un uai est invalide", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/uai/0000856A");

    strictEqual(response.status, 400);
    deepStrictEqual(response.data, {
      code: "0000856A",
    });
  });
});
