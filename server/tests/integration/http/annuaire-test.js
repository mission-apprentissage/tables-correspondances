const { strictEqual, deepStrictEqual } = require("assert");
const httpTests = require("../../utils/httpTests");
const { createAnnuaire } = require("../../utils/fixtures");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut lister des établissements", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      uai: "0010856A",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      uais_secondaires: [],
    }).save();

    const response = await httpClient.get("/api/v1/annuaire/etablissements");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      etablissements: [
        {
          uai: "0010856A",
          siret: "11111111111111",
          raisonSociale: "Centre de formation",
          uais_secondaires: [],
          liens: [],
          siegeSocial: true,
          statut: "actif",
          referentiel: "test",
          adresse: {
            geojson: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [2.396444, 48.879706],
              },
              properties: {
                score: 0.88,
              },
            },
            label: "31 rue des lilas Paris 75019",
            numero_voie: "31",
            type_voie: "RUE",
            nom_voie: "31",
            code_postal: "75001",
            code_insee: "75000",
            localite: "PARIS",
            cedex: null,
          },
        },
      ],
      pagination: {
        page: 1,
        resultats_par_page: 10,
        nombre_de_page: 1,
        total: 1,
      },
    });
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un uai", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      uai: "0010856A",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      uais_secondaires: [],
    }).save();

    const response = await httpClient.get("/api/v1/annuaire/etablissements?filter=0010856A");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].uai, "0010856A");
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un siret", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      uai: "0010856A",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      uais_secondaires: [],
    }).save();

    const response = await httpClient.get("/api/v1/annuaire/etablissements?filter=11111111111111");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111111111");
  });

  it("Vérifie que le service retourne une liste vide quand aucun etablissement ne correspond", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/v1/annuaire/etablissements?filter=XXX");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      etablissements: [],
      pagination: {
        page: 1,
        resultats_par_page: 10,
        nombre_de_page: 1,
        total: 0,
      },
    });
  });

  it("Vérifie que le service retourne une 400 quand les paramètres sont invalides", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/v1/annuaire/etablissements?invalid=XXX");

    strictEqual(response.status, 400);
    deepStrictEqual(response.data.details[0].path[0], "invalid");
  });

  it("Vérifie qu'on peut obtenir un établissement", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      uai: "0010856A",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      uais_secondaires: [],
    }).save();

    const response = await httpClient.get("/api/v1/annuaire/etablissements/11111111111111");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      uai: "0010856A",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      uais_secondaires: [],
      liens: [],
      siegeSocial: true,
      statut: "actif",
      referentiel: "test",
      adresse: {
        geojson: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [2.396444, 48.879706],
          },
          properties: {
            score: 0.88,
          },
        },
        label: "31 rue des lilas Paris 75019",
        numero_voie: "31",
        type_voie: "RUE",
        nom_voie: "31",
        code_postal: "75001",
        code_insee: "75000",
        localite: "PARIS",
        cedex: null,
      },
    });
  });

  it("Vérifie qu'on renvoie une 404 si le siret n'est pas connu", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/v1/annuaire/etablissements/11111111111111");

    strictEqual(response.status, 404);
    deepStrictEqual(response.data, {
      error: "Not Found",
      message: "Siret inconnu",
      statusCode: 404,
    });
  });
});
