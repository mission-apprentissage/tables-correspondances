const catalogue = require("./assets/onisepUrls.json");
const apiOnisep = require("../../../common/apis/apiOnisep");

const findOnisepInfosFromMef = async (providedMef) => {
  if (!providedMef || !/^[0-9]{10,11}$/g.test(providedMef.trim())) {
    return {};
  }
  let mef = `${providedMef}`.trim();

  const { results } = await apiOnisep.getFormations({
    q: mef,
  });
  let match = {};
  for (let jte = 0; jte < results.length; jte++) {
    const result = results[jte];
    if (result.code_mef === mef) {
      match = result;
    }
  }
  return match;
};

const findOnisepInfosFromMefs = async (providedMefs) => {
  let data = [];
  for (let ite = 0; ite < providedMefs.length; ite++) {
    const mef = providedMefs[ite];
    const { results } = await apiOnisep.getFormations({
      q: mef,
    });
    for (let jte = 0; jte < results.length; jte++) {
      const result = results[jte];
      if (result.code_mef === mef) {
        data.push(result);
      }
    }
  }
  return data;
};

const findOnisepInfosFromCfd = async (providedCfd) => {
  if (!providedCfd || !/^[0-9A-Z]{8}[A-Z]?$/g.test(providedCfd.trim())) {
    return {};
  }

  let cfd = providedCfd.length === 9 ? providedCfd.substring(0, 8) : providedCfd;
  cfd = `${cfd}`.trim();

  const { results } = await apiOnisep.getFormations({
    q: cfd,
  });
  let match = {};
  for (let jte = 0; jte < results.length; jte++) {
    const result = results[jte];
    if (result.code_formation_diplome === cfd) {
      match = result;
    }
  }
  return match;
};

const findOnisepInfos = async (cfd = "", mefs) => {
  let dataMef = [];
  if (mefs) {
    for (let ite = 0; ite < mefs.length; ite++) {
      const mef = mefs[ite];
      const { results } = await apiOnisep.getFormations({
        q: mef.mef10,
      });
      for (let jte = 0; jte < results.length; jte++) {
        const result = results[jte];
        if (result.code_mef === mef.mef10) {
          dataMef.push(result);
        }
      }
    }
  }

  let dataCfd = {};
  if (cfd !== "") {
    dataCfd = await findOnisepInfosFromCfd(cfd);
  }

  const onisep_url = catalogue[cfd] || null;

  if (!onisep_url && dataMef.length === 0 && Object.keys(dataCfd).length === 0) {
    return {
      result: {
        url: null,
      },
      messages: {
        url: "Non trouvé",
      },
    };
  }

  let uniqResult = {};
  if (dataMef.length === 1) {
    uniqResult = dataMef[0];
  }

  return {
    result: {
      url: onisep_url,
      mefs: dataMef,
      ...uniqResult,
      ...dataCfd,
    },
    messages: {
      url: "Ok",
    },
  };
};

module.exports = { findOnisepInfosFromMef, findOnisepInfos, findOnisepInfosFromMefs, findOnisepInfosFromCfd };
