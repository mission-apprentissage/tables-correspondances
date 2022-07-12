const { runScript } = require("../../jobs/scriptWrapper");
const bcnController = require("../controllers/bcn/BcnController");
const fcController = require("../controllers/rncp/rncpController");
const { findOnisepInfos } = require("../controllers/onisep/onisepController");
const { asyncForEach } = require("../../common/utils/asyncUtils");

const getDataFromRncpAndBcnHandlingTypeCertif = async (rncpValue, bcnData) => {
  const rncpData = await fcController.getDataFromRncp(rncpValue);
  if (!rncpData.result.code_type_certif && bcnData.result.libelle_court?.startsWith("TH")) {
    rncpData.result.code_type_certif = "TP";
  }
  return rncpData;
};

const getDataFromCfd = async (providedCfd, options = { onisep: true }) => {
  const bcnData = await bcnController.getDataFromCfd(providedCfd);

  if (!bcnData.result.cfd) {
    return {
      result: {
        ...bcnData.result,
        rncps: [],
        mefs: {},
      },
      messages: {
        ...bcnData.messages,
        rncps: [],
        mefs: {},
      },
    };
  }

  const mefs = await bcnController.getMefsFromCfd(bcnData.result.cfd);
  const mef = await bcnController.getUniqMefFromMefs(mefs);

  const onisepData = options.onisep
    ? await findOnisepInfos(bcnData.result.cfd, mefs.result.mefs10)
    : {
        result: {},
        messages: {},
      };

  let rncps = [];
  let rncps_messages = [];

  const codesRncpUpdated = await fcController.findRncpListFromCfd(bcnData.result.cfd);

  if (codesRncpUpdated.value.length > 0) {
    await asyncForEach(codesRncpUpdated.value, async (currentRncp) => {
      const rncpData = await getDataFromRncpAndBcnHandlingTypeCertif(currentRncp, bcnData);
      if (rncpData) {
        rncps.push(rncpData.result);
        rncps_messages.push({ rncp: currentRncp, messages: rncpData.messages?.code_rncp });
      }
    });
  } else {
    rncps_messages.push({ error: codesRncpUpdated.info });
  }

  return {
    result: {
      ...bcnData.result,
      rncps,
      mefs: {
        ...mefs.result,
        ...mef.result,
      },
      onisep: {
        ...onisepData.result,
      },
    },
    messages: {
      ...bcnData.messages,

      rncps: rncps_messages,
      mefs: {
        ...mefs.messages,
        ...mef.messages,
      },
      onisep: {
        ...onisepData.messages,
      },
    },
  };
};
module.exports.getDataFromCfd = getDataFromCfd;

if (process.env.run) {
  runScript(async () => {
    const result = await getDataFromCfd(process.argv[2]);
    console.log(result);
  });
}
