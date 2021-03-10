const { oleoduc, transformData, accumulateData, flattenArray } = require("oleoduc");

function readSiretsAsStream(input) {
  return oleoduc(
    input,
    accumulateData((acc, d) => acc + d.toString(), { accumulator: "" }),
    transformData((data) => JSON.parse(data)),
    flattenArray()
  );
}

module.exports = async (custom = {}) => {
  let input = custom.input || process.stdin;

  return {
    stream() {
      return oleoduc(
        readSiretsAsStream(input),
        transformData((siret) => ({ siret })),
        { promisify: false }
      );
    },
  };
};
