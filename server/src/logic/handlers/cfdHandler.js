const { runScript } = require("../../jobs/scriptWrapper");
const bcnController = require("../controllers/bcn/BcnController");
const fcController = require("../controllers/rncp/rncpController");
const { findUrl } = require("../controllers/onisep/onisepController");
const { findOpcosFromCfd } = require("./opcoHandler");

const getDataFromCfd = async (providedCfd) => {
  const bcnData = await bcnController.getDataFromCfd(providedCfd);

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

  const mefs = await bcnController.getMefsFromCfd(bcnData.result.cfd);
  const mef = await bcnController.getUniqMefFromMefs(mefs);

  const onisep_url = await findUrl(bcnData.result.cfd);

  let rncpData = {
    result: {},
    messages: {},
  };
  const codeRncpUpdated = await fcController.findRncpFromCfd(bcnData.result.cfd);
  if (codeRncpUpdated.value) {
    rncpData = await fcController.getDataFromRncp(codeRncpUpdated.value);
    if (!rncpData.result.code_type_certif && bcnData.result.libelle_court?.startsWith("TH")) {
      rncpData.result.code_type_certif = "TP";
    }
  } else {
    rncpData = {
      result: {},
      messages: {
        error: codeRncpUpdated.info,
      },
    };
  }

  const opcosData = await findOpcosFromCfd(bcnData.result.cfd);

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
      opcos: opcosData,
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
