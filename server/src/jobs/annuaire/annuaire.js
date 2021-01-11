const { oleoduc, writeData } = require("oleoduc");
const depp = require("./types/depp");
const dgefp = require("./types/dgefp");

const loadDEPP = async (deppStream) => {
  let etablissements = [];

  await oleoduc(
    depp.etablissementsStream(deppStream),
    writeData((etablissement) => etablissements.push({ ...etablissement, sources: ["depp"] }))
  );
  return etablissements;
};

const addDGEFP = async (dgefpStream, etablissements) => {
  let stats = {
    total: 0,
    updated: 0,
    missing: 0,
  };

  await oleoduc(
    dgefp.etablissementsStream(dgefpStream),
    writeData((data) => {
      stats.total++;

      let index = etablissements.findIndex((e) => e.siret === data.siret);
      if (index !== -1) {
        etablissements[index].sources.push("dgefp");
        stats.updated++;
      } else {
        stats.missing++;
      }
    })
  );

  return stats;
};

module.exports = {
  build: async (deppStream, dgefpStream) => {
    let etablissements = await loadDEPP(deppStream);

    let stats = await addDGEFP(dgefpStream, etablissements);

    return {
      etablissements,
      stats: {
        depp: {
          total: etablissements.length,
        },
        dgefp: stats,
      },
    };
  },
};
