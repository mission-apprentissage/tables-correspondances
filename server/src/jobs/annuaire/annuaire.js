const { oleoduc, transformData, writeData } = require("oleoduc");
const parsers = require("./parsers/parsers");

const loadEtablissements = async (type, stream) => {
  let accumulator = {};
  let csvParser = parsers[type]();

  await oleoduc(
    stream,
    csvParser,
    transformData((e) => ({ ...e, uais: [{ type: "depp", uai: e.uai }] })),
    writeData((etablissement) => {
      let siret = etablissement.siret;
      if (!accumulator[siret]) {
        //Remove duplicated
        accumulator[siret] = etablissement;
      }
    })
  );

  return Object.values(accumulator);
};

module.exports = {
  build: async (deppStream, sources) => {
    let etablissements = await loadEtablissements("depp", deppStream);
    let stats = {};

    await Promise.all(
      sources.map(({ type, stream }) => {
        let parser = parsers[type]();
        stats[type] = stats[type] || {
          total: 0,
          updated: 0,
          missing: 0,
          same: 0,
        };

        return oleoduc(
          stream,
          parser,
          writeData((current) => {
            stats[type].total++;

            let index = etablissements.findIndex((e) => e.siret === current.siret);
            if (index === -1 || !current.uai) {
              stats[type].missing++;
            } else {
              if (etablissements[index].uai === current.uai) {
                stats[type].same++;
              } else {
                stats[type].updated++;
                etablissements[index].uais.push({ type, uai: current.uai });
              }
            }
          })
        );
      })
    );

    return {
      etablissements,
      stats,
    };
  },
};
