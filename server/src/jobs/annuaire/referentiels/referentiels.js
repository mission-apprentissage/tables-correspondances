const fs = require("fs");

const referentiels = fs.readdirSync(__dirname).reduce((acc, filename) => {
  let type = filename.split(".")[0];

  return {
    ...acc,
    [type]: require(`./${filename}`),
  };
}, {});

async function createReferentiel(type, ...args) {
  let referentiel = await referentiels[type](...args);
  referentiel.type = type;
  return referentiel;
}

module.exports = {
  createReferentiel,
  getDefaultReferentiels: () => {
    return [
      async (options) => createReferentiel("depp", options),
      async (options) => createReferentiel("dgefp", options),
    ];
  },
};
