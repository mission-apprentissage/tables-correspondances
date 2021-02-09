const faker = require("faker"); // eslint-disable-line node/no-unpublished-require
const { Annuaire } = require("../../src/common/model");

module.exports = {
  models: {
    Sample: {
      nom: "TEST",
      valeur: "Valeur",
    },
  },
  createAnnuaire: (custom) => {
    return new Annuaire({
      uai: faker.helpers.replaceSymbols("#######?"),
      siret: faker.helpers.replaceSymbols("#########00015"),
      raisonSociale: faker.company.companyName(),
      uais_secondaires: [],
      filiations: [],
      referentiel: "test",
      siegeSocial: true,
      statut: "actif",
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
      ...custom,
    });
  },
};
