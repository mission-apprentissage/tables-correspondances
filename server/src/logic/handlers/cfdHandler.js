const { runScript } = require("../../jobs/scriptWrapper");
const bcnController = require("../controllers/bcn/BcnController");
const fcController = require("../controllers/rncp/rncpController");
const onisepController = require("../controllers/onisep/onisepController");

const getDataFromCfd = async (providedCfd) => {
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

  await onisepController.load();
  const onisep_url = await onisepController.findUrl(bcnData.result.cfd);

  let rncpData = {
    result: {},
    messages: {},
  };
  const codeRncpUpdated = await fcController.findRncpFromCfd(bcnData.result.cfd);
  if (codeRncpUpdated.value) {
    rncpData = await fcController.getDataFromRncp(codeRncpUpdated.value);
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
      onisep: {
        ...onisep_url.result,
      },
    },
    messages: {
      ...bcnData.messages,

      rncp: { ...rncpData.messages },
      mefs: {
        ...mefs.messages,
        ...mef.messages,
      },
      onisep: {
        ...onisep_url.messages,
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
