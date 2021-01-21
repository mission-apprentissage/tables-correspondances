const geoController = require("../controllers/geo/geoController");

const getDataFromCP = async (providedCP) => {
  if (!providedCP || !geoController.isValidCodePostal(providedCP.trim())) {
    return {
      result: {},
      messages: {
        error: `Erreur: Le code postal fourni doit être définit et au format 5 caractères ${providedCP}`,
      },
    };
  }

  let codePostal = `${providedCP}`.trim();

  const { info, value, update } = await geoController.findCode(codePostal);

  if (!value) {
    return {
      result: {},
      messages: {
        error: `Erreur: Le code postal fourni est introuvable ${providedCP}`,
      },
    };
  }

  const { insee_com, code_dept, postal_code, nom_comm } = value;

  const { nom_dept, nom_region, code_region, nom_academie, num_academie } = geoController.findDataByDepartementNum(
    code_dept
  );

  return {
    result: {
      code_postal: postal_code,
      code_commune_insee: insee_com,
      commune: nom_comm,
      num_departement: code_dept,
      nom_departement: nom_dept,
      region: nom_region,
      num_region: code_region,
      nom_academie: nom_academie,
      num_academie: num_academie,
    },
    messages: {
      cp: info,
      update: update ? update : "",
    },
  };
};
module.exports.getDataFromCP = getDataFromCP;

const getCoordaniteFromAdresseData = async ({ numero_voie, type_voie, nom_voie, code_postal, localite }) => {
  const geoUpdated = await getDataFromCP(code_postal);
  const coordUpdated = await geoController.findGeoCoordinateFromAdresse({
    numero_voie,
    type_voie,
    nom_voie,
    code_postal,
    localite,
  });

  return {
    result: {
      geo_coordonnees: coordUpdated.value,
      ...geoUpdated.result,
    },
    messages: {
      geo_coordonnees: coordUpdated.info,
      ...geoUpdated.messages,
    },
  };
};
module.exports.getCoordaniteFromAdresseData = getCoordaniteFromAdresseData;
