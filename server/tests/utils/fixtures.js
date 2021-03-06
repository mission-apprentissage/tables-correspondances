const faker = require("faker"); // eslint-disable-line node/no-unpublished-require
const { merge } = require("lodash"); // eslint-disable-line node/no-unpublished-require
const { Annuaire } = require("../../src/common/model");

module.exports = {
  models: {
    Sample: {
      nom: "TEST",
      valeur: "Valeur",
    },
  },
  insertAnnuaire(custom) {
    return Annuaire.create(
      merge(
        {},
        {
          siret: faker.helpers.replaceSymbols("#########00015"),
          raison_sociale: faker.company.companyName(),
          uais: [],
          relations: [],
          lieux_de_formation: [],
          reseaux: [],
          diplomes: [],
          certifications: [],
          referentiels: ["test"],
          siege_social: true,
          statut: "actif",
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
        },
        custom
      )
    );
  },
};
