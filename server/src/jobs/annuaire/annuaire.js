const { oleoduc, transformData, writeData } = require("oleoduc");
const parsers = require("./parsers/parsers");

const getEtablissements = async (type, stream) => {
  let etablissements = [];
  let csvParser = parsers[type]();

  await oleoduc(
    stream,
    csvParser,
    transformData((e) => ({ ...e, sources: [type] })),
    writeData((e) => etablissements.push(e))
  );
  return etablissements;
};

module.exports = {
  build: async (deppStream, dgefpStream) => {
    let etablissements = await getEtablissements("depp", deppStream);
    let stats = {
      total: 0,
      updated: 0,
      missing: 0,
    };

    await oleoduc(
      dgefpStream,
      parsers.dgefp(),
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
