const { strictEqual, deepStrictEqual } = require("assert");
const httpTests = require("../../utils/httpTests");
const { createAnnuaire } = require("../../utils/fixtures");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut lister des établissements", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      uai: "0010856A",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
    }).save();

    const response = await httpClient.get("/api/v1/annuaire/etablissements");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, [
      {
        uai: "0010856A",
        siret: "11111111111111",
        nom: "Centre de formation",
        uais_secondaires: [],
      },
    ]);
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un uai", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      uai: "0010856A",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
    }).save();

    const response = await httpClient.get("/api/v1/annuaire/etablissements?value=0010856A");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, [
      {
        uai: "0010856A",
        siret: "11111111111111",
        nom: "Centre de formation",
        uais_secondaires: [],
      },
    ]);
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un siret", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      uai: "0010856A",
      siret: "11111111111111",
      nom: "Centre de formation",
      uais_secondaires: [],
    }).save();

    const response = await httpClient.get("/api/v1/annuaire/etablissements?value=11111111111111");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, [
      {
        uai: "0010856A",
        siret: "11111111111111",
        nom: "Centre de formation",
        uais_secondaires: [],
      },
    ]);
  });

  it("Vérifie que le service retourne une liste vide quand aucun etablissement ne correspond", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/v1/annuaire/etablissements?value=XXX");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, []);
  });
});
