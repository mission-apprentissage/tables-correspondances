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
        "onisep",
        "onisep-structure",
        "opcoep",
        "refea",
        "gesti",
        "ymag",
        "agri",
        "anasup",
        "compagnons-du-devoir",
        "promotrans",
        "ideo2",
        "etablissements",
        "catalogue",
        "sirene",
        "ramsese",
        "deca",
        "sifa",
      ],
      ["academie"],
      [
        //Theses sources used uai as selector, so we tried to collect as many uais as possible before running them
        "ccca-btp",
        "cci-france",
        "cma",
      ],
    ];
  },
};
