const assert = require("assert");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

function adresse(coordinates, custom = {}) {
  return {
    label: "31 rue des lilas Paris 75019",
    code_postal: "75001",
    code_insee: "75000",
    localite: "PARIS",
    geojson: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates,
      },
      properties: {
        score: 0.88,
      },
    },
    ...custom,
  };
}

function line(coordinates, custom = {}) {
  return (
    JSON.stringify({
      uai: "0441687X",
      academie: "Paris",
      administration: {
        nature: "Administration centrale",
        niveau: "UAI célibataire",
        categorie_juridique: "Service de l'Etat",
      },
      adresse: "31 rue des lilas",
      dateOuverture: "1975-02-14T00:00:00.000Z",
      denominations: { denomination_principale: "Centre de formations" },
      etat: "Ouvert",
      localisation: { adresse: "31 rue des lilas", acheminement: "75019 PARIS" },
      maj: "2020-12-01T00:00:00.000Z",
      nom: "Centre de formation",
      rattachements: { fille: [], mere: [] },
      secteur: "Public",
      specificites: [],
      tel: "0123456789",
      tutelle: "ministère de l'éducation nationale",
      zones: { agglomeration_urbaine: "PARIS", canton: "19EME", commune: "PARIS" },
      geojson: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates,
        },
      },
      ...custom,
    }) + "\n"
  );
}

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des informations du fichier acce (geojson)", async () => {
    await insertAnnuaire({
      siret: "11111111111111",
      adresse: adresse([2.396363, 48.879668], { label: "31 rue des lilas Paris 75019" }),
    });

    let source = await createSource("acce", {
      input: createStream(line([2.396363, 48.879668]), { adresse: "31 rue des lilas" }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["acce"],
        uai: "0441687X",
        valide: false,
      },
    ]);
    assert.deepStrictEqual(stats, {
      acce: {
        total: 1,
        updated: 1,
        failed: 0,
      },
    });
  });

  it("Vérifie qu'on trouve un établissement dans une rayon de 10 mètres", async () => {
    await insertAnnuaire({
      siret: "11111111111111",
      adresse: adresse([2.396414, 48.879641]),
    });

    let source = await createSource("acce", {
      input: createStream(line([2.396363, 48.879668]), { adresse: "31 rue des lilas" }),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, [
      {
        sources: ["acce"],
        uai: "0441687X",
        valide: false,
      },
    ]);
  });

  it("Vérifie qu'on ignore un établissement trop loin", async () => {
    await insertAnnuaire({
      siret: "11111111111111",
      adresse: adresse([2.39572, 48.878401], { label: "15 rue des lilas Paris 75019" }),
    });

    let source = await createSource("acce", {
      input: createStream(line([2.396363, 48.879668]), { adresse: "31 rue des lilas" }),
    });

    let stats = await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.uais, []);
    assert.deepStrictEqual(stats, {
      acce: {
        total: 1,
        updated: 0,
        failed: 0,
      },
    });
  });
});
