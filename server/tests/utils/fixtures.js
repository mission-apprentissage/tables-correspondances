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
      nom: faker.company.companyName(),
      uais_secondaires: [],
      referentiel: "test",
      siegeSocial: true,
      statut: "actif",
      adresse: {
        position: { coordinates: [2.396444, 48.879706], type: "Point" },
        label: "31 Rue des Lilas 75019 Paris",
        region: "11",
        numero_voie: "31",
        type_voie: "RUE",
        nom_voie: "DES LILAS",
        code_postal: "75001",
        localite: "PARIS",
        code_insee_localite: "75000",
      },
      ...custom,
    });
  },
};
