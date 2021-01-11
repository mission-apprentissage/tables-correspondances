const { oleoduc, csvStream, jsonStream } = require("oleoduc");

module.exports = {
  export: (source, output, options = {}) => {
    return oleoduc(source, options.format === "csv" ? csvStream() : jsonStream(), output);
  },
};
