const trimObjKeys = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [typeof key === "string" ? key.trim() : key]: value,
    };
  }, {});
};

module.exports.trimObjKeys = trimObjKeys;

const trimObjValues = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]: typeof value === "string" ? value.trim() : value,
    };
  }, {});
};

module.exports.trimObjValues = trimObjValues;

const trimObjEntries = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [typeof key === "string" ? key.trim() : key]: typeof value === "string" ? value.trim() : value,
    };
  }, {});
};

module.exports.trimObjEntries = trimObjEntries;

const getDuplicates = (arr) => {
  const seen = new Set();
  const store = new Array();
  arr.filter((item) => seen.size === seen.add(item).size && !store.includes(item) && store.push(item));
  return store;
};
module.exports.getDuplicates = getDuplicates;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports.wait = wait;
