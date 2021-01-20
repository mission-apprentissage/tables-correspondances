const fs = require("fs");

let sources = fs.readdirSync(__dirname).reduce((acc, filename) => {
  let type = filename.split(".")[0];

  return {
    ...acc,
    [type]: require(`./${filename}`),
  };
}, {});

module.exports = {
  createSource: (type, options = {}) => {
    return sources[type](options.stream);
  },
};