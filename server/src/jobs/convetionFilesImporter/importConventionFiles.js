const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { chunk } = require("lodash");

module.exports = async (db, publicOfsp, datadock, depp, dgefp) => {
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
        logger.info(`Inserted ${200 * (i + 1)}`);
      } catch (error) {
        console.error(error);
      }
    });

    await db.collection("conventionfiles").insertMany(datadock.map((d) => ({ ...d, type: "DATADOCK" })));
    await db.collection("conventionfiles").insertMany(depp.map((d) => ({ ...d, type: "DEPP" })));
    await db.collection("conventionfiles").insertMany(dgefp.map((d) => ({ ...d, type: "DGEFP" })));

    logger.info(`Importing Convention files Succeed`);
  } catch (error) {
    logger.error(error);
    logger.error(`Importing Convention files table Failed`);
  }
};
