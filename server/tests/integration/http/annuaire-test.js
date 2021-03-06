const { omit } = require("lodash");
const { strictEqual, deepStrictEqual } = require("assert");
const httpTests = require("../../utils/httpTests");
const { insertAnnuaire } = require("../../utils/fixtures");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut lister des établissements", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire({
      siret: "11111111100001",
      raison_sociale: "Centre de formation",
      _meta: {
        anomalies: [],
        created_at: new Date("2021-02-10T16:39:13.064Z"),
      },
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      etablissements: [
        {
          siret: "11111111100001",
          raison_sociale: "Centre de formation",
          uais: [],
          relations: [],
          lieux_de_formation: [],
          reseaux: [],
          diplomes: [],
          certifications: [],
          siege_social: true,
          statut: "actif",
          referentiels: ["test"],
          conformite_reglementaire: {
            conventionne: true,
          },
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
            code_postal: "75001",
            code_insee: "75000",
            localite: "PARIS",
          },
          academie: {
            code: "01",
            nom: "Paris",
          },
          _meta: {
            anomalies: [],
            created_at: "2021-02-10T16:39:13.064Z",
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
    await insertAnnuaire();
    await insertAnnuaire({
      uais: [
        {
          source: "dummy",
          uai: "0010856A",
          valide: true,
        },
      ],
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements?uai=0010856A");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].uais[0].uai, "0010856A");
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un siret", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire();
    await insertAnnuaire({
      siret: "11111111100001",
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements?siret=11111111100001");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111100001");
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un siren", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire();
    await insertAnnuaire({
      siret: "11111111100001",
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements?siret=11111111100001");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111100001");
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un uai (fulltext)", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire();
    await insertAnnuaire({
      uais: [
        {
          source: "dummy",
          uai: "0010856A",
          valide: true,
        },
      ],
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements?text=0010856A");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].uais[0].uai, "0010856A");
  });

  it("Vérifie qu'on peut rechercher des établissements à partir d'un siret (fulltext)", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire();
    await insertAnnuaire({
      siret: "11111111100001",
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements?text=11111111100001");

    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111100001");
  });

  it("Vérifie qu'on peut trier les établissements par nombre de relations", async () => {
    const { httpClient } = await startServer();
    await Promise.all([
      insertAnnuaire({
        siret: "11111111100001",
        relations: [
          {
            siret: "22222222222222",
            label: "NOMAYO",
            annuaire: true,
            source: "test",
          },
        ],
      }),
      insertAnnuaire({
        siret: "33333333333333",
        relations: [
          {
            siret: "11111111100001",
            label: "NOMAYO",
            annuaire: true,
            source: "test",
          },
          {
            siret: "22222222222222",
            label: "NOMAYO",
            annuaire: true,
            source: "test",
          },
        ],
      }),
    ]);

    let response = await httpClient.get("/api/v1/annuaire/etablissements?tri=relations&ordre=desc");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "33333333333333");
    strictEqual(response.data.etablissements[1].siret, "11111111100001");

    response = await httpClient.get("/api/v1/annuaire/etablissements?tri=relations&ordre=asc");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111100001");
    strictEqual(response.data.etablissements[1].siret, "33333333333333");
  });

  it("Vérifie qu'on peut trier les établissements par nombre d'uais secondaires", async () => {
    const { httpClient } = await startServer();
    await Promise.all([
      insertAnnuaire({
        siret: "11111111100001",
        uais: [
          {
            source: "catalogue",
            uai: "1111111S",
            valide: true,
          },
        ],
      }),
      insertAnnuaire({
        siret: "33333333333333",
        uais: [
          {
            source: "catalogue",
            uai: "1111111S",
            valide: true,
          },
          {
            source: "catalogue",
            uai: "2222222S",
            valide: true,
          },
        ],
      }),
    ]);

    let response = await httpClient.get("/api/v1/annuaire/etablissements?tri=uais&ordre=desc");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "33333333333333");
    strictEqual(response.data.etablissements[1].siret, "11111111100001");

    response = await httpClient.get("/api/v1/annuaire/etablissements?tri=uais&ordre=asc");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111100001");
    strictEqual(response.data.etablissements[1].siret, "33333333333333");
  });

  it("Vérifie qu'on peut limiter les champs renvoyés pour la liste des établissements", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire({
      siret: "11111111100001",
      raison_sociale: "Centre de formation",
      _meta: {
        anomalies: [],
        created_at: new Date("2021-02-10T16:39:13.064Z"),
      },
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements?champs=siret,uai");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      etablissements: [
        {
          siret: "11111111100001",
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

  it("Vérifie qu'on peut peut limiter le établissement par page", async () => {
    const { httpClient } = await startServer();
    await Promise.all([
      insertAnnuaire({ siret: "11111111100001" }),
      insertAnnuaire({ siret: "22222222222222" }),
      insertAnnuaire({ siret: "33333333333333" }),
    ]);

    let response = await httpClient.get("/api/v1/annuaire/etablissements?items_par_page=1&page=1");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements.length, 1);

    response = await httpClient.get("/api/v1/annuaire/etablissements?items_par_page=1&page=2");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements.length, 1);
  });

  it("Vérifie qu'on peut filtrer les établissements avec des anomalies", async () => {
    const { httpClient } = await startServer();
    await Promise.all([
      insertAnnuaire({
        siret: "11111111100001",
        _meta: {
          anomalies: [
            {
              task: "collect",
              source: "sirene",
              reason: "Etablissement inconnu",
              date: new Date("2021-02-10T08:31:58.572Z"),
            },
          ],
        },
      }),
      insertAnnuaire({
        siret: "333333333333333",
      }),
    ]);

    let response = await httpClient.get("/api/v1/annuaire/etablissements?anomalies=true");
    strictEqual(response.status, 200);
    strictEqual(response.data.etablissements[0].siret, "11111111100001");

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

  it("Vérifie que le service retourne une 400 quand les paramètres sont inconnus", async () => {
    const { httpClient } = await startServer();

    let response = await httpClient.get("/api/v1/annuaire/etablissements?invalid=XXX");

    strictEqual(response.status, 400);
    deepStrictEqual(response.data.details[0].path[0], "invalid");
  });

  it("Vérifie que le service retourne une 400 quand les paramètres sont invalides", async () => {
    const { httpClient } = await startServer();

    let response = await httpClient.get("/api/v1/annuaire/etablissements?ordre=-1");

    strictEqual(response.status, 400);
    deepStrictEqual(response.data.details[0].path[0], "ordre");
  });

  it("Vérifie qu'on peut obtenir un établissement", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire({
      siret: "11111111100001",
      raison_sociale: "Centre de formation",
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements/11111111100001");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      siret: "11111111100001",
      raison_sociale: "Centre de formation",
      uais: [],
      relations: [],
      reseaux: [],
      lieux_de_formation: [],
      diplomes: [],
      certifications: [],
      siege_social: true,
      statut: "actif",
      referentiels: ["test"],
      conformite_reglementaire: {
        conventionne: true,
      },
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
        code_postal: "75001",
        code_insee: "75000",
        localite: "PARIS",
      },
      academie: {
        code: "01",
        nom: "Paris",
      },
    });
  });

  it("Vérifie qu'on peut limiter les champs renvoyés pour un établissement", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire({
      siret: "11111111100001",
      raison_sociale: "Centre de formation",
      _meta: {
        anomalies: [],
        created_at: new Date("2021-02-10T16:39:13.064Z"),
      },
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements/11111111100001?champs=siret,uai");

    strictEqual(response.status, 200);
    deepStrictEqual(response.data, {
      siret: "11111111100001",
    });
  });

  it("Vérifie qu'on peut exclure des champs renvoyés pour un établissement", async () => {
    const { httpClient } = await startServer();
    await insertAnnuaire({
      siret: "11111111100001",
      raison_sociale: "Centre de formation",
      _meta: {
        anomalies: [],
        created_at: new Date("2021-02-10T16:39:13.064Z"),
      },
    });

    let response = await httpClient.get("/api/v1/annuaire/etablissements/11111111100001?champs=-siret,uai");

    strictEqual(response.status, 200);
    strictEqual(response.data.siret, undefined);
    strictEqual(response.data.uai, undefined);
  });

  it("Vérifie qu'on renvoie une 404 si le siret n'est pas connu", async () => {
    const { httpClient } = await startServer();

    let response = await httpClient.get("/api/v1/annuaire/etablissements/11111111100001");

    strictEqual(response.status, 404);
    deepStrictEqual(response.data, {
      error: "Not Found",
      message: "Siret inconnu",
      statusCode: 404,
    });
  });

  it("Vérifie qu'on peut lister les stats", async () => {
    const { httpClient, computeStats } = await startServer();
    await insertAnnuaire({ siret: "11111111100001" });
    await computeStats();

    let response = await httpClient.get("/api/v1/annuaire/stats");

    strictEqual(response.status, 200);
    deepStrictEqual(omit(response.data.stats[0], ["created_at"]), {
      referentiels: [{ name: "dgefp", nbSirens: 1, nbSirets: 1 }],
      globale: {
        nbSirens: 1,
        nbSirets: 1,
        nbSiretsGestionnairesEtFormateurs: 0,
        nbSiretsGestionnaires: 0,
        nbSiretsFormateurs: 0,
        nbSiretsSansUAIs: 1,
        nbSiretsAvecPlusieursUAIs: 0,
      },
      academies: [
        {
          academie: {
            code: "01",
            nom: "Paris",
          },
          nbSirens: 1,
          nbSirets: 1,
          nbSiretsGestionnairesEtFormateurs: 0,
          nbSiretsGestionnaires: 0,
          nbSiretsFormateurs: 0,
          nbSiretsSansUAIs: 1,
          nbSiretsAvecPlusieursUAIs: 0,
        },
      ],
    });
  });
});
