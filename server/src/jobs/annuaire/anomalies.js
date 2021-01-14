const { oleoduc, filterData, transformData, writeData } = require("oleoduc");
const { getEtablissementStatus } = require("./utils/entrepriseAPI")(process.env.API_ENTREPRISE_KEY);
const validateUAI = require("./utils/validateUAI");
const parsers = require("./parsers/parsers");

const getUAIStatus = (etablissement) => {
  if (!etablissement.uai) {
    return "";
  }
  return validateUAI(etablissement.uai) ? "valide" : "invalide";
};

module.exports = {
  invalidSiretsStream: (type, source) => {
    let sirets = [];
    let csvParser = parsers[type]();

    return oleoduc(
      source,
      csvParser,
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
  getDoublons: async (type, source) => {
    let accumulator = {};
    let csvParser = parsers[type]();

    await oleoduc(
      source,
      csvParser,
      writeData(async (etablissement) => {
        let siret = etablissement.siret;
        if (accumulator[siret]) {
          accumulator[siret].nombre++;
        } else {
          accumulator[siret] = { ...etablissement, nombre: 1 };
        }
      })
    );

    return Object.values(accumulator).filter((d) => d.nombre > 1);
  },
};
