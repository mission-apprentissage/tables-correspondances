const { createReadStream } = require("fs");
const { oleoduc, transformData, accumulateData, flattenArray } = require("oleoduc");

function readSiretsAsStream(file) {
  return oleoduc(
    createReadStream(file),
    accumulateData((acc, d) => acc + d.toString(), { accumulator: "" }),
    transformData((data) => JSON.parse(data)),
    flattenArray()
  );
}
module.exports = async () => {
  return oleoduc(
    readSiretsAsStream("/home/bguerout/Downloads/envs/siret-uai-null.json"),
    transformData((siret) => ({ siret })),
    { promisify: false }
  );
};
