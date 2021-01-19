const entrepriseController = require("../controllers/entrepriseController");
const { getCoordaniteFromAdresseData } = require("./geoHandler");

const getDataFromSiret = async (providedSiret) => {
  const siretData = await entrepriseController.findDataFromSiret(providedSiret);

  let geoData = {
    result: {},
    messages: {},
  };
  if (Object.keys(siretData.result).length > 0) {
    const { numero_voie, type_voie, nom_voie, code_postal, localite } = siretData.result;
    geoData = await getCoordaniteFromAdresseData({ numero_voie, type_voie, nom_voie, code_postal, localite });
  }

  return {
    result: {
      ...siretData.result,
      ...geoData.result,
    },
    messages: {
      ...siretData.messages,
      ...geoData.messages,
    },
  };
};
module.exports.getDataFromSiret = getDataFromSiret;
