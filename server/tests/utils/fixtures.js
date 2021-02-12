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
      uaisSecondaires: [],
      relations: [],
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
        numeroVoie: "31",
        typeVoie: "RUE",
        nomVoie: "31",
        codePostal: "75001",
        codeInsee: "75000",
        localite: "PARIS",
        cedex: null,
      },
      ...custom,
    });
  },
};
