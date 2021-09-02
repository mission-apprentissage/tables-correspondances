const fs = require("fs");

let sources = fs.readdirSync(__dirname).reduce((acc, filename) => {
  let type = filename.split(".")[0];

  return {
    ...acc,
    [type]: require(`./${filename}`),
  };
}, {});

function createSource(name, ...args) {
  return sources[name](...args);
}

module.exports = {
  createSource,
  getDefaultSourcesGroupedByPriority() {
    return [
      [
        "agri",
        "anasup",
        "compagnons-du-devoir",
        "deca",
        "catalogue",
        "gesti",
        "ideo2",
        "onisep",
        "onisep-structure",
        "opcoep",
        "promotrans",
        "sifa-ramsese",
        "depp",
        "refea",
        "sirene",
        "ymag",
        "tableau-de-bord",
      ],
      [
        "formations", //This source consumes the same API as the sirene source
        //Theses sources used uai as selector, so we tried to collect as many uais as possible before running them
        "ccca-btp",
        "cci-france",
        "cma",
      ],
    ];
  },
};
