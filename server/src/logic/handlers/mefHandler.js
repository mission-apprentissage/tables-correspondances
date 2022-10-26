const bcnController = require("../controllers/bcn/BcnController");
const fcController = require("../controllers/rncp/rncpController");
const { findOnisepInfosFromMef } = require("../controllers/onisep/onisepController");

const getDataFromMef10 = async (providedMef) => {
  const mefData = await bcnController.getDataFromMef1011(providedMef);
  const cfdData = await bcnController.getDataFromCfd(mefData.result.cfd);

  let rncpData = {
    result: {},
    messages: {},
  };
  const codeRncpUpdated = await fcController.findRncpListFromCfd(cfdData.result.cfd);
  if (codeRncpUpdated.value?.length) {
    rncpData = await fcController.getDataFromRncp(codeRncpUpdated.value[0]);
  } else {
    rncpData = {
      result: {},
      messages: {
        error: codeRncpUpdated.info,
      },
    };
  }

  const onisepData = await findOnisepInfosFromMef(mefData.result.mef10);

  return {
    result: {
      ...mefData.result,
      cfd: {
        ...cfdData.result,
      },
      rncp: { ...rncpData.result },
      onisep: { ...onisepData },
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
