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

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(() => resolve(), milliseconds));
}

function timeout(promise, millis) {
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(`Timed out after ${millis} ms.`), millis);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeout));
}

module.exports = { asyncForEach, promiseAllProps, delay, timeout };
