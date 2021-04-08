const catalogue = require("./assets/onisepUrls.json");
const { Onisep } = require("../../../common/model/index");

const findOnisepInfosEtablissementFromUAI = async (uai, nom_academie) => {
  const match = await Onisep.findOne({ code_uai: uai, academie: nom_academie, type: "etablissement" })
    .select({ code_uai: 1, academie: 1, nom: 1, cp: 1, ville: 1, lien_site_onisepfr: 1, _id: 0 })
    .lean();
  return match || {};
};

const findOnisepInfosFromMef = async (providedMef) => {
  if (!providedMef || !/^[0-9]{10,11}$/g.test(providedMef.trim())) {
    return {};
  }
  let mef = `${providedMef}`.trim();
  const match = await Onisep.findOne({ code_mef: mef, type: "formation" })
    .select({
      code_formation_diplome: 1,
      code_mef: 1,
      libelle_formation_principal: 1,
      libelle_poursuite: 1,
      lien_site_onisepfr: 1,
      discipline: 1,
      domaine_sousdomaine: 1,
      _id: 0,
    })
    .lean();
  return match || {};
};

const findOnisepInfosFromMefs = async (providedMefs) => {
  const match = await Onisep.find({ code_mef: { $in: providedMefs }, type: "formation" })
    .select({
      code_formation_diplome: 1,
      code_mef: 1,
      libelle_formation_principal: 1,
      libelle_poursuite: 1,
      lien_site_onisepfr: 1,
      discipline: 1,
      domaine_sousdomaine: 1,
      _id: 0,
    })
    .lean();
  return match || [];
};

const findOnisepInfosFromCfd = async (providedCfd) => {
  if (!providedCfd || !/^[0-9A-Z]{8}[A-Z]?$/g.test(providedCfd.trim())) {
    return {};
  }

  let cfd = providedCfd.length === 9 ? providedCfd.substring(0, 8) : providedCfd;
  cfd = `${cfd}`.trim();

  const match = await Onisep.findOne({ code_formation_diplome: cfd, type: "formation" })
    .select({
      code_formation_diplome: 1,
      code_mef: 1,
      libelle_formation_principal: 1,
      libelle_poursuite: 1,
      lien_site_onisepfr: 1,
      discipline: 1,
      domaine_sousdomaine: 1,
      _id: 0,
    })
    .lean();
  return match || {};
};

const findOnisepInfos = async (cfd = "", mefs) => {
  let dataMef = [];
  if (mefs) {
    const currentMefs = mefs.map((m) => m.mef10);
    dataMef = await findOnisepInfosFromMefs(currentMefs);
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

module.exports = {
  findOnisepInfosEtablissementFromUAI,
  findOnisepInfosFromMef,
  findOnisepInfos,
  findOnisepInfosFromMefs,
  findOnisepInfosFromCfd,
};
