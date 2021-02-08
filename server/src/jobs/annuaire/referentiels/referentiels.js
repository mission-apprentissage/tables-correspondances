const fs = require("fs");
const { getOvhFileAsStream } = require("../../../common/ovhStorage");

const referentiels = fs.readdirSync(__dirname).reduce((acc, filename) => {
  let type = filename.split(".")[0];

  return {
    ...acc,
    [type]: require(`./${filename}`),
  };
}, {});

const createReferentiel = (type, ...args) => {
  let referentiel = referentiels[type](...args);
  referentiel.type = type;
  return referentiel;
};

module.exports = {
  createReferentiel,
  getDefaultReferentiels: () => {
    return Promise.all(
      [
        async () => {
          let stream = await getOvhFileAsStream("annuaire/DEPP-CFASousConvRegionale_17122020_1.csv");
          return createReferentiel("depp", stream);
        },
        async () => {
          let stream = await getOvhFileAsStream("annuaire/DGEFP-20210105_public_ofs.csv");
          return createReferentiel("dgefp", stream);
        },
      ].map((build) => build())
    );
  },
};
