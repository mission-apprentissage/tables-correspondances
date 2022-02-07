const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { chunk } = require("lodash");

// const cleanUpKeysAndValues = (obj) => {
//   return Object.entries(obj).reduce((acc, [key, value]) => {
//     return {
//       ...acc,
//       [key.trim()]: value.trim(),
//     };
//   }, {});
// };

module.exports = async (db, publicOfsp) => {
  try {
    const publicOfs = publicOfsp.map((i) => {
      const line = Object.entries(i).reduce(
        (acc, [key, value]) => {
          return {
            ...acc,
            [key.trim()]: value,
          };
        },
        { type: "DATAGOUV" }
      );
      delete line[""];
      return line;
    });

    const chunks = chunk(publicOfs, 200);

    await asyncForEach(chunks, async (chunkpart, i) => {
      try {
        await db.collection("conventionfiles").insertMany(chunkpart);
        logger.debug(`Inserted ${200 * (i + 1)}`);
      } catch (error) {
        console.error(error);
      }
    });

    logger.info(`Importing Convention files Succeed`);
  } catch (error) {
    logger.error(error);
    logger.error(`Importing Convention files table Failed`);
  }
};
