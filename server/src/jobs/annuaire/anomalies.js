const { oleoduc, filterData, transformData, writeData } = require("oleoduc");
const { Readable } = require("stream");
const { getEtablissementStatus } = require("./utils/entrepriseAPI")(process.env.API_ENTREPRISE_KEY);
const validateUAI = require("./utils/validateUAI");
const types = {
  depp: require("./types/depp"),
  dgefp: require("./types/dgefp"),
};

const getUAIStatus = (etablissement) => {
  if (!etablissement.uai) {
    return "";
  }
  return validateUAI(etablissement.uai) ? "valide" : "invalide";
};

module.exports = {
  invalidSiretsStream: (type, source) => {
    let stream = types[type].etablissementsStream(source);
    let sirets = [];

    return oleoduc(
      stream,
      filterData(({ siret }) => {
        sirets.push(siret);
        return sirets.filter((s) => s === siret).length <= 1;
      }),
      transformData(
        async (etablissement) => {
          let siret = etablissement.siret;

          let status = await getEtablissementStatus(siret);
          let anomalie = { ...etablissement, status_siret: status, status_uai: getUAIStatus(etablissement) };

          return status !== "actif" ? anomalie : null;
        },
        { parallel: 15 }
      )
    );
  },
  doublonsStream: async (type, source) => {
    let accumulator = {};
    let stream = types[type].etablissementsStream(source);

    await oleoduc(
      stream,
      writeData(async (etablissement) => {
        let siret = etablissement.siret;
        if (accumulator[siret]) {
          accumulator[siret].nombre++;
        } else {
          accumulator[siret] = { ...etablissement, nombre: 1 };
        }
      })
    );

    let doublons = Object.values(accumulator).filter((d) => d.nombre > 1);
    return Readable.from(doublons);
  },
};
