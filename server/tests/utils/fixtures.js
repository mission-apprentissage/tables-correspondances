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
      region: "11",
      siegeSocial: true,
      dateCreation: new Date("2020-11-26T23:00:00.000Z"),
      statut: "actif",
      referentiel: "test",
      ...custom,
    });
  },
};
