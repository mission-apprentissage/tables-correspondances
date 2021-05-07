const { isPlainObject, zipObject, keys, values } = require("lodash");

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function promiseAllProps(data) {
  if (isPlainObject(data)) {
    return zipObject(keys(data), await Promise.all(values(data)));
  }
  return Promise.all(data);
}

module.exports = { asyncForEach, promiseAllProps };
