async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function timeout(promise, millis) {
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(`Timed out after ${millis} ms.`), millis);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeout));
}

module.exports = { asyncForEach, timeout };
