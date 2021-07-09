const { oleoduc, writeData } = require("oleoduc");
const { uniq, range } = require("lodash");
const mergeStream = require("merge-stream");

async function loadData(sources, isSame) {
  let memo = [];
  let streams = await Promise.all(sources.map((source) => source.stream()));

  await oleoduc(
    mergeStream(streams),
    writeData(({ from, selector: siret, uais = [] }) => {
      let data = { uai: uais[0], siret };

      let found = memo.find((i) => isSame(i, data));
      if (found) {
        found.sources = uniq([...found.sources, from]);
      } else {
        memo.push({
          ...data,
          sources: [from],
        });
      }
    })
  );

  return memo;
}

async function buildSimilarites(sources, fields) {
  let isSame = (s1, s2) => {
    return fields.reduce((acc, field) => {
      if (acc === false) {
        return false;
      }

      return s1[field] === s2[field];
    }, null);
  };

  let data = await loadData(sources, isSame);

  return {
    total: data.length,
    ...range(1, sources.length + 1).reduce((acc, index) => {
      return {
        ...acc,
        [index]: data.filter((u) => u.sources.length === index).length,
      };
    }, {}),
  };
}

module.exports = buildSimilarites;
