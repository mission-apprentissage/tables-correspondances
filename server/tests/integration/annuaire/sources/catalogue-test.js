const assert = require("assert");
const { omit } = require("lodash");
const ApiError = require("../../../../src/common/apis/ApiError");
const { Annuaire, BcnFormationDiplome } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { importReferentiel } = require("../../../utils/testUtils");
const { getMockedApiGeoAddresse, getMockedApiCatalogue } = require("../../../utils/apiMocks");
const { insertAnnuaire } = require("../../../utils/fixtures");

function createFormationsSource(custom = {}) {
  return createSource("catalogue", {
    apiCatalogue: getMockedApiCatalogue((mock, responses) => {
      mock.onGet(/.*formations.*/).reply(200, responses.formations());
    }),
    apiGeoAdresse: getMockedApiGeoAddresse((mock, responses) => {
      mock.onGet(/reverse.*/).reply(200, responses.reverse());
    }),
    ...custom,
  });
}

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des relations (formateur)", async () => {
    await importReferentiel();
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_gestionnaire_siret: "11111111111111",
                etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
                etablissement_formateur_siret: "22222222222222",
                etablissement_formateur_entreprise_raison_sociale: "Etablissement",
              },
            ],
          })
        );
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.ok(found.gestionnaire);
    assert.ok(!found.formateur);
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        label: "Etablissement",
        annuaire: false,
        type: "formateur",
        sources: ["catalogue"],
      },
    ]);
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des relations (gestionnaire)", async () => {
    await importReferentiel();
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_gestionnaire_siret: "22222222222222",
                etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
                etablissement_formateur_siret: "11111111111111",
                etablissement_formateur_entreprise_raison_sociale: "Etablissement",
              },
            ],
          })
        );
      }),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.ok(!found.gestionnaire);
    assert.ok(found.formateur);
    assert.deepStrictEqual(found.relations, [
      {
        siret: "22222222222222",
        label: "Entreprise",
        annuaire: false,
        type: "gestionnaire",
        sources: ["catalogue"],
      },
    ]);
  });

  it("Vérifie que seuls les établissements avec au moins une formation active en 2021 sont formateurs", async () => {
    await importReferentiel();
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations(?!2021).*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_gestionnaire_siret: "22222222222222",
                etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
                etablissement_formateur_siret: "11111111111111",
                etablissement_formateur_entreprise_raison_sociale: "Etablissement",
              },
            ],
          })
        );
        mock.onGet(/.*formations2021.*/).reply(200, {
          formations: [],
        });
      }),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.ok(!found.gestionnaire);
    assert.ok(!found.formateur);
  });

  it("Vérifie qu'on peut collecter des diplômes (cfd)", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"22222222222222"`);
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_formateur_siret: "22222222222222",
                etablissement_formateur_entreprise_raison_sociale: "Etablissement",
                cfd: "40030001",
                cfd_specialite: null,
              },
            ],
          })
        );
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "22222222222222" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.diplomes, [
      {
        code: "40030001",
        type: "cfd",
      },
    ]);
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des diplômes (cfd+bcn)", async () => {
    await BcnFormationDiplome.create({
      FORMATION_DIPLOME: "40030001",
      NIVEAU_FORMATION_DIPLOME: "26C",
      LIBELLE_COURT: "FORMATION",
    });
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"22222222222222"`);
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_formateur_siret: "22222222222222",
                etablissement_formateur_entreprise_raison_sociale: "Etablissement",
                cfd: "40030001",
              },
            ],
          })
        );
      }),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "22222222222222" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.diplomes, [
      {
        code: "40030001",
        type: "cfd",
        niveau: "26C",
        label: "FORMATION",
      },
    ]);
  });

  it("Vérifie qu'on ne collecte pas de diplômes pour les établissements gestionnaire", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"11111111111111"`);
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_gestionnaire_siret: "11111111111111",
                etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
                cfd: "40030001",
              },
            ],
          })
        );
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.diplomes, []);
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des certifications (rncp)", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"22222222222222"`);
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_formateur_siret: "22222222222222",
                etablissement_formateur_entreprise_raison_sociale: "Etablissement",
                rncp_code: "RNCP28662",
                rncp_intitule: "Gestionnaire de l'administration des ventes et de la relation commerciale",
              },
            ],
          })
        );
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "22222222222222" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.certifications, [
      {
        code: "RNCP28662",
        label: "Gestionnaire de l'administration des ventes et de la relation commerciale",
        type: "rncp",
      },
    ]);
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on ne collecte pas de certifications pour les établissements gestionnaire", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"11111111111111"`);
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_gestionnaire_siret: "11111111111111",
                etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
                rncp_code: "RNCP28662",
                rncp_intitule: "Gestionnaire de l'administration des ventes et de la relation commerciale",
              },
            ],
          })
        );
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.certifications, []);
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut collecter des lieux de formation", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"22222222222222"`);
    let source = await createFormationsSource({
      apiGeoAdresse: getMockedApiGeoAddresse((mock, responses) => {
        mock.onGet(/reverse.*/).reply(
          200,
          responses.reverse({
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [2.396444, 48.879706],
                },
                properties: {
                  label: "32 Rue des lilas 75019 Paris",
                  score: 0.88,
                  name: "32 Rue des Lilas",
                  city: "Paris",
                },
              },
            ],
          })
        );
      }),
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_formateur_siret: "22222222222222",
                lieu_formation_siret: "33333333333333",
                lieu_formation_geo_coordonnees: "48.879706,2.396444",
              },
            ],
          })
        );
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "22222222222222" }, { _id: 0 }).lean();

    assert.deepStrictEqual(found.lieux_de_formation[0], {
      siret: "33333333333333",
      adresse: {
        label: "32 Rue des lilas 75019 Paris",
        code_postal: "75019",
        code_insee: "75119",
        localite: "Paris",
        geojson: {
          type: "Feature",
          geometry: { coordinates: [2.396444, 48.879706], type: "Point" },
          properties: { score: 0.88 },
        },
        region: {
          code: "11",
          label: "Île-de-France",
        },
      },
    });
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on ne collecte pas des lieux de formation pour les établissements gestionnaire", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"11111111111111"`);
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_gestionnaire_siret: "11111111111111",
                lieu_formation_siret: "33333333333333",
                lieu_formation_geo_coordonnees: "48.879706,2.396444",
              },
            ],
          })
        );
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();

    assert.deepStrictEqual(found.lieux_de_formation, []);
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on cherche une adresse quand ne peut pas reverse-geocoder un lieu de formation", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"22222222222222"`);
    let source = await createFormationsSource({
      apiGeoAdresse: getMockedApiGeoAddresse((mock, responses) => {
        mock.onGet(/reverse.*/).reply(400, {});
        mock.onGet(/search.*/).reply(200, responses.search());
      }),
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_formateur_siret: "22222222222222",
              },
            ],
          })
        );
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "22222222222222" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.lieux_de_formation[0].adresse, {
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
      label: "31 Rue des lilas 75019 Paris",
      code_postal: "75019",
      code_insee: "75119",
      localite: "Paris",
      region: {
        code: "11",
        label: "Île-de-France",
      },
    });
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on créer une anomalie quand on ne peut pas trouver l'adresse d'un lieu de formation", async () => {
    await importReferentiel(`"numero_uai";"numero_siren_siret_uai"
"0011058V";"22222222222222"`);
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_formateur_siret: "22222222222222",
              },
            ],
          })
        );
      }),
      apiGeoAdresse: getMockedApiGeoAddresse((mock) => {
        mock.onGet(/reverse.*/).reply(400, {});
        mock.onGet(/search.*/).reply(400, {});
      }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "22222222222222" }, { _id: 0 }).lean();

    assert.strictEqual(found.lieux_de_formation.length, 0);
    assert.strictEqual(found._meta.anomalies.length, 1);
    assert.deepStrictEqual(omit(found._meta.anomalies[0], ["date"]), {
      task: "collect",
      source: "catalogue",
      details: "Lieu de formation inconnu : 31 rue des lilas. Adresse inconnue [2.396444,48.879706]",
    });
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 1,
        failed: 1,
      },
    });
  });

  it("Vérifie qu'on peut filter par siret", async () => {
    await insertAnnuaire({
      siret: "11111111100000",
    });
    let source = await createFormationsSource();

    let stats = await collect(source, { filters: { siret: "33333333333333" } });

    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 0,
        updated: 0,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on peut détecter des relations avec des établissements déjà dans l'annuaire", async () => {
    await importReferentiel();
    await insertAnnuaire({ siret: "22222222222222", raison_sociale: "Mon centre de formation" });
    let source = await createFormationsSource({
      apiCatalogue: getMockedApiCatalogue((mock, responses) => {
        mock.onGet(/.*formations.*/).reply(
          200,
          responses.formations({
            formations: [
              {
                etablissement_gestionnaire_siret: "11111111111111",
                etablissement_gestionnaire_entreprise_raison_sociale: "Entreprise",
                etablissement_formateur_siret: "22222222222222",
                etablissement_formateur_entreprise_raison_sociale: "Etablissement",
              },
            ],
          })
        );
      }),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.strictEqual(found.relations[0].annuaire, true);
  });

  it("Vérifie qu'on gère une erreur lors de la récupération des formations", async () => {
    await importReferentiel();
    let failingApi = {
      getFormations: () => {
        throw new ApiError("api", "HTTP error");
      },
    };
    let source = await createFormationsSource({ apiCatalogue: failingApi });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }).lean();
    assert.deepStrictEqual(found._meta.anomalies[0].details, "[api] HTTP error");
    assert.deepStrictEqual(stats, {
      catalogue: {
        total: 1,
        updated: 0,
        failed: 1,
      },
    });
  });
});
