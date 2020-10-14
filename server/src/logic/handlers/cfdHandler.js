const bcnController = require("../controllers/bcn/BcnController");
const fcController = require("../controllers/fc/fcController");

const getDataFromCfd = (providedCfd) => {
  const bcnData = bcnController.getDataFromCfd(providedCfd);

  if (!bcnData.result.cfd) {
    return {
      result: {
        ...bcnData.result,
        rncp: {},
        mefs: {},
      },
      messages: {
        ...bcnData.messages,
        rncp: {},
        mefs: {},
      },
    };
  }

  const mefs = bcnController.getMefsFromCfd(bcnData.result.cfd);
  const mef = bcnController.getUniqMefFromMefs(mefs);

  let rncpData = {
    result: {},
    messages: {},
  };
  const codeRncpUpdated = fcController.findRncpFromCfd(bcnData.result.cfd);
  if (codeRncpUpdated.value) {
    rncpData = fcController.getDataFromRncp(codeRncpUpdated.value);
  } else {
    rncpData = {
      result: {},
      messages: {
        error: codeRncpUpdated.info,
      },
    };
  }

  return {
    result: {
      ...bcnData.result,
      rncp: { ...rncpData.result },
      mefs: {
        ...mefs.result,
        ...mef.result,
      },
    },
    messages: {
      ...bcnData.messages,

      rncp: { ...rncpData.messages },
      mefs: {
        ...mefs.messages,
        ...mef.messages,
      },
    },
  };
};
module.exports.getDataFromCfd = getDataFromCfd;
