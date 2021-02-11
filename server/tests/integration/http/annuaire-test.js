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
      _meta: {
        anomalies: [],
        lastUpdate: new Date("2021-02-10T16:39:13.064Z"),
      },
    }).save();

    let response = await httpClient.get("/api/v1/annuaire/etablissements");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      etablissements: [
        {
          uai: "0010856A",
          siret: "11111111111111",
          raisonSociale: "Centre de formation",
          uaisSecondaires: [],
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
          _meta: {
            anomalies: [],
            lastUpdate: "2021-02-10T16:39:13.064Z",
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
    }).save();

    let response = await httpClient.get("/api/v1/annuaire/etablissements?text=0010856A");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].uai, "0010856A");
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un siret", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      siret: "11111111111111",
    }).save();

    let response = await httpClient.get("/api/v1/annuaire/etablissements?text=11111111111111");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111111111");
  });

  it("Vérifie qu'on peut trier les établissements par nombre de liens", async () => {
    const { httpClient } = await startServer();
    await Promise.all([
      createAnnuaire({
        siret: "11111111111111",
        liens: [
          {
            siret: "22222222222222",
            type: "sirene",
            statut: "actif",
            exists: true,
          },
        ],
      }).save(),
      createAnnuaire({
        siret: "33333333333333",
        liens: [
          {
            siret: "11111111111111",
            type: "sirene",
            statut: "actif",
            exists: true,
          },
          {
            siret: "22222222222222",
            type: "sirene",
            statut: "actif",
            exists: true,
          },
        ],
      }).save(),
    ]);

    let response = await httpClient.get("/api/v1/annuaire/etablissements?sortBy=liens&order=-1");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "33333333333333");
    strictEqual(response.data.etablissements[1].siret, "11111111111111");

    response = await httpClient.get("/api/v1/annuaire/etablissements?sortBy=liens&order=1");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111111111");
    strictEqual(response.data.etablissements[1].siret, "33333333333333");
  });

  it("Vérifie qu'on peut trier les établissements par nombre d'uais secondaires", async () => {
    const { httpClient } = await startServer();
    await Promise.all([
      createAnnuaire({
        siret: "11111111111111",
        uaisSecondaires: [
          {
            type: "catalogue",
            uai: "1111111S",
            valide: true,
          },
        ],
      }).save(),
      createAnnuaire({
        siret: "33333333333333",
        uaisSecondaires: [
          {
            type: "catalogue",
            uai: "1111111S",
            valide: true,
          },
          {
            type: "catalogue",
            uai: "2222222S",
            valide: true,
          },
        ],
      }).save(),
    ]);

    let response = await httpClient.get("/api/v1/annuaire/etablissements?sortBy=uaisSecondaires&order=-1");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "33333333333333");
    strictEqual(response.data.etablissements[1].siret, "11111111111111");

    response = await httpClient.get("/api/v1/annuaire/etablissements?sortBy=uaisSecondaires&order=1");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111111111");
    strictEqual(response.data.etablissements[1].siret, "33333333333333");
  });

  it("Vérifie qu'on peut filtrer les établissements avec des anomalies", async () => {
    const { httpClient } = await startServer();
    await Promise.all([
      createAnnuaire({
        siret: "11111111111111",
        _meta: {
          anomalies: [
            {
              type: "collect",
              source: "sirene",
              reason: "Etablissement inconnu",
              date: new Date("2021-02-10T08:31:58.572Z"),
            },
          ],
        },
      }).save(),
      createAnnuaire({
        siret: "333333333333333",
      }).save(),
    ]);

    let response = await httpClient.get("/api/v1/annuaire/etablissements?anomalies=true");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111111111");

    response = await httpClient.get("/api/v1/annuaire/etablissements?anomalies=false");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "333333333333333");

    response = await httpClient.get("/api/v1/annuaire/etablissements");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements.length, 2);
  });

  it("Vérifie que le service retourne une liste vide quand aucun etablissement ne correspond", async () => {
    const { httpClient } = await startServer();

    let response = await httpClient.get("/api/v1/annuaire/etablissements?text=XXX");

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

    let response = await httpClient.get("/api/v1/annuaire/etablissements?invalid=XXX");

    strictEqual(response.status, 400);
    deepStrictEqual(response.data.details[0].path[0], "invalid");
  });

  it("Vérifie qu'on peut obtenir un établissement", async () => {
    const { httpClient } = await startServer();
    await createAnnuaire({
      uai: "0010856A",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
    }).save();

    let response = await httpClient.get("/api/v1/annuaire/etablissements/11111111111111");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      uai: "0010856A",
      siret: "11111111111111",
      raisonSociale: "Centre de formation",
      uaisSecondaires: [],
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

    let response = await httpClient.get("/api/v1/annuaire/etablissements/11111111111111");

    strictEqual(response.status, 404);
    deepStrictEqual(response.data, {
      error: "Not Found",
      message: "Siret inconnu",
      statusCode: 404,
    });
  });
});
