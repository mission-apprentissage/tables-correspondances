const fs = require("fs");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

let sources = fs.readdirSync(__dirname).reduce((acc, filename) => {
  let type = filename.split(".")[0];

  return {
    ...acc,
    [type]: require(`./${filename}`),
  };
}, {});

async function createSource(type, ...args) {
  let source = await sources[type](...args);
  source.type = type;
  return source;
}

module.exports = {
  createSource,
  getSourcesChunks: () => {
    return [
      [
        () => {
          return createSource("catalogue");
        },
        () => {
          return createSource("sirene");
        },
        async () => {
          let stream = await getOvhFileAsStream("annuaire/ONISEP-ideo-structures_denseignement_secondaire.csv");
          return createSource("onisep", stream);
        },
        async () => {
          let stream = await getOvhFileAsStream("annuaire/ONISEP-ideo-structures_denseignement_superieur.csv");
          return createSource("onisep", stream);
        },
        async () => {
          let stream = await getOvhFileAsStream("annuaire/ONISEP-Structures-20012021PL.csv");
          return createSource("onisepStructure", stream);
        },
        async () => {
          let stream = await getOvhFileAsStream("annuaire/REFEA-liste-uai-avec-coordonnees.csv");
          return createSource("refea", stream);
        },
        async () => {
          let stream = await getOvhFileAsStream(
            "annuaire/OPCO EP-20201202 OPCO EP - Jeunes sans contrat par CFA, région et formation au 26 nov.csv"
          );
          return createSource("opcoep", stream);
        },
      ],
      [
        //Second chunks with sources that need data from the previous chunk
        () => {
          return createSource("academie");
        },
      ],
    ];
  },
};
