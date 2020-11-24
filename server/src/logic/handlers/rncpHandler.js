const rncpController = require("../controllers/rncp/rncpController");
const bcnController = require("../controllers/bcn/BcnController");

const getDataFromRncp = async (providedRncp) => {
  const rncpData = await rncpController.getDataFromRncp(providedRncp);

  if (!rncpData.result.cfd) {
    return {
      result: {
        ...rncpData.result,
        cfd: {},
        mefs: {},
      },
      messages: {
        ...rncpData.messages,
        cfd: {},
        mefs: {},
      },
    };
  }

  const cfdData = await bcnController.getDataFromCfd(rncpData.result.cfd);
  const mefs = await bcnController.getMefsFromCfd(cfdData.result.cfd);
  const mef = await bcnController.getUniqMefFromMefs(mefs);

  return {
    result: {
      ...rncpData.result,
      cfd: {
        ...cfdData.result,
      },
      mefs: {
        ...mefs.result,
        ...mef.result,
      },
    },
    messages: {
      ...rncpData.messages,
      cfd: {
        ...cfdData.messages,
      },
      mefs: {
        ...mefs.messages,
        ...mef.messages,
      },
    },
  };
};
module.exports.getDataFromRncp = getDataFromRncp;
