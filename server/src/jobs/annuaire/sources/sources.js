const fs = require("fs");

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
  getDefaultSourcesGroupedByPriority() {
    return [
      [
        () => createSource("etablissements"),
        () => createSource("sirene"),
        () => createSource("onisep"),
        () => createSource("onisepStructure"),
        () => createSource("opcoep"),
        () => createSource("refea"),
        () => createSource("gesti"),
        () => createSource("ymag"),
        () => createSource("agri"),
        () => createSource("anasup"),
        () => createSource("compagnons-du-devoir"),
        () => createSource("promotrans"),
        () => createSource("ideo2"),
        () => createSource("formations"),
      ],
      [
        //This group contains sources that need data from the previous groups
        () => createSource("academie"),
      ],
      [
        //Theses sources used uai as selector, so we tried to collect as many uais as possible before running them
        () => createSource("ccca-btp"),
        () => createSource("cci-france"),
        () => createSource("cma"),
      ],
    ];
  },
};
