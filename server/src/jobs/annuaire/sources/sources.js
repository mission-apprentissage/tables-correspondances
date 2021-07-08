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
  getSourcesToValidate() {
    return ["deca", "etablissements", "ramsese", "sifa"];
  },
  getDefaultSourcesGroupedByPriority() {
    return [
      [
        "agri",
        "anasup",
        "compagnons-du-devoir",
        "deca",
        "etablissements",
        "gesti",
        "ideo2",
        "onisep",
        "onisep-structure",
        "opcoep",
        "promotrans",
        "ramsese",
        "refea",
        "sifa",
        "sirene",
        "ymag",
      ],
      [
        "catalogue", //This source consumes the same API as the sirene source
        "academie", // Needs data provided by sirene
        //Theses sources used uai as selector, so we tried to collect as many uais as possible before running them
        "ccca-btp",
        "cci-france",
        "cma",
      ],
    ];
  },
};
