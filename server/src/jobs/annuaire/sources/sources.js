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
      ],
      [
        //Second group contains sources that need data from the previous group
        () => createSource("academie"),
        () => createSource("ideo2"),
      ],
      [() => createSource("formations")],
    ];
  },
};
