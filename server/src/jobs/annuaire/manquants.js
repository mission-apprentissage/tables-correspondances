const { oleoduc, transformData, writeData } = require("oleoduc");
const { Etablissement } = require("../../common/model/index");
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
  findMissingDEPPInCatalogue: async (deppStream) => {
    let missing = [];
    await oleoduc(
      deppStream,
      parsers.depp(),
      transformData(
        async ({ siret, nom, uai }) => {
          let nb = await Etablissement.count({ $or: [{ siret }, { uai }, { ds_questions_uai: uai }] });

          return nb === 0 ? { siret, nom, uai } : null;
        },
        { parallel: 50 }
      ),
      writeData((d) => missing.push(d))
    );

    return missing;
  },
  findMissingDGEFPInCatalogue: async (dgefpStream) => {
    let missing = [];
    await oleoduc(
      dgefpStream,
      parsers.dgefp(),
      transformData(
        async ({ siret, nom }) => {
          let nb = await Etablissement.count({ siret });
          return nb === 0 ? { siret, nom } : null;
        },
        { parallel: 50 }
      ),
      writeData((d) => missing.push(d))
    );

    return missing;
  },
  findMissingCatalogueInDGEFP: async (dgefpStream) => {
    let etablissementsFromDGEFP = await getEtablissements("dgefp", dgefpStream);

    let missing = [];
    await oleoduc(
      Etablissement.find().cursor(),
      transformData(
        async ({ uai, siret, nom }) => {
          let manquants = [];

          let found = etablissementsFromDGEFP.find((e) => e.siret === siret) === null;

          return found ? { uai, siret, nom, manquants } : null;
        },
        { parallel: 50 }
      ),
      writeData((d) => missing.push(d))
    );

    return missing;
  },
};
