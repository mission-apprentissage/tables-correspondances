const rncpController = require("../controllers/rncp/rncpController");
const bcnController = require("../controllers/bcn/BcnController");

const getDataFromRncp = async (providedRncp) => {
  const rncpData = await rncpController.getDataFromRncp(providedRncp);

  if (!rncpData.result.cfds) {
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

  const cfdsDataResult = [];
  const cfdsDataMessage = [];
  for (let ite = 0; ite < rncpData.result.cfds.length; ite++) {
    const cfd = rncpData.result.cfds[ite];
    const cfdData = await bcnController.getDataFromCfd(cfd);
    const mefs = await bcnController.getMefsFromCfd(cfdData.result.cfd);
    const mef = await bcnController.getUniqMefFromMefs(mefs);
    cfdsDataResult.push({
      cfd: {
        ...cfdData.result,
      },
      mefs: {
        ...mefs.result,
        ...mef.result,
      },
    });
    cfdsDataMessage.push({
      cfd: {
        ...cfdData.messages,
      },
      mefs: {
        ...mefs.messages,
        ...mef.messages,
      },
    });
  }

  return {
    result: {
      ...rncpData.result,
      releated: cfdsDataResult,
    },
    messages: {
      ...rncpData.messages,
      releated: cfdsDataMessage,
    },
  };
};
module.exports.getDataFromRncp = getDataFromRncp;
