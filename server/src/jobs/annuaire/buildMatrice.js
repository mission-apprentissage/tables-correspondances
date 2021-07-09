const { oleoduc, transformData, writeData } = require("oleoduc");
const { intersectionWith, unionWith, uniqWith } = require("lodash");
const mergeStream = require("merge-stream");

async function loadDataBySource(sources) {
  let memo = sources.map((s) => s.name).reduce((acc, value) => ({ ...acc, [value]: [] }), {});
  let streams = await Promise.all(sources.map((source) => source.stream()));

  await oleoduc(
    mergeStream(streams),
    transformData(({ from, selector: siret, uais = [] }) => {
      return { from, uai: uais[0], siret };
    }),
    writeData(({ from, ...rest }) => {
      memo[from].push(rest);
    })
  );

  return memo;
}

async function buildMatrice(sources, fields) {
  let isSame = (s1, s2) => {
    return fields.reduce((acc, field) => {
      if (acc === false) {
        return false;
      }

      return s1[field] === s2[field];
    }, null);
  };

  let data = await loadDataBySource(sources);

  return sources.reduce((matrice, source) => {
    let sourceName = source.name;
    let values = uniqWith(data[sourceName], isSame);
    let otherSourceNames = sources.map((s) => s.name).filter((name) => name !== sourceName);

    return {
      ...matrice,
      [sourceName]: otherSourceNames.reduce((acc, otherSourceName) => {
        let otherValues = uniqWith(data[otherSourceName], isSame);

        return {
          ...acc,
          [sourceName]: {
            intersection: values.length,
            union: values.length,
          },
          [otherSourceName]: {
            intersection: intersectionWith(values, otherValues, isSame).length,
            union: unionWith(values, otherValues, isSame).length,
          },
        };
      }, {}),
    };
  }, {});
}

module.exports = buildMatrice;
