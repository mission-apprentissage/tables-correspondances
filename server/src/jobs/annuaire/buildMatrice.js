const { oleoduc, writeData } = require("oleoduc");
const { intersectionWith, unionWith, uniqWith } = require("lodash");
const mergeStream = require("merge-stream");

async function buildMatrice(sources, fields) {
  let names = sources.map((s) => s.name);

  let memo = names.reduce((acc, value) => {
    return {
      ...acc,
      [value]: [],
    };
  }, {});

  let streams = await Promise.all(sources.map((source) => source.stream()));
  await oleoduc(
    mergeStream(streams),
    writeData(async ({ from, selector: siret, uais = [] }) => {
      memo[from].push({ uai: uais[0], siret });
    })
  );

  return names.reduce((matrice, sourceName) => {
    let isSame = (s1, s2) => {
      return fields.reduce((acc, field) => {
        if (!field) {
          return false;
        }

        return s1[field] === s2[field];
      }, false);
    };

    let values = uniqWith(memo[sourceName], isSame);
    let otherSourceNames = sources.map((s) => s.name).filter((name) => name !== sourceName);

    return {
      ...matrice,
      [sourceName]: otherSourceNames.reduce((acc, otherSourceName) => {
        let otherValues = uniqWith(memo[otherSourceName], isSame);

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
