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
        (options) => createSource("etablissements", options),
        (options) => createSource("sirene", options),
        (options) => createSource("onisep", options),
        (options) => createSource("onisepStructure", options),
        (options) => createSource("opcoep", options),
        (options) => createSource("refea", options),
      ],
      [
        //Second group contains sources that need data from the previous group
        (options) => createSource("academie", options),
        (options) => createSource("formations", options),
      ],
    ];
  },
};
