const bcnController = require("../controllers/bcn/BcnController");
const fcController = require("../controllers/fc/fcController");

const getDataFromMef10 = (providedMef10) => {
  const mefData = bcnController.getDataFromMef10(providedMef10);
  const cfdData = bcnController.getDataFromCfd(mefData.result.cfd);

  let rncpData = {
    result: {},
    messages: {},
  };
  const codeRncpUpdated = fcController.findRncpFromCfd(cfdData.result.cfd);
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
      ...mefData.result,
      cfd: {
        ...cfdData.result,
      },
      rncp: { ...rncpData.result },
    },
    messages: {
      ...mefData.messages,
      cfd: {
        ...cfdData.messages,
      },
      rncp: { ...rncpData.messages },
    },
  };
};
module.exports.getDataFromMef10 = getDataFromMef10;
