const axios = require("axios");
const apiEsSup = require("../../common/apiEsSup");
const geoAdresseData = require("./geoAdresseData");

const opendataApiKey = "19b8028585be8b5c2ebc456a6363756a48b680d8447a1ebfb8a1d10f";

class GeoController {
  constructor() {
    this.baseCodePostaux = [];
  }

  async searchDataSoft(code) {
    try {
      const response = await axios.get(
        `https://data.opendatasoft.com/api/records/1.0/search/?dataset=correspondance-code-insee-code-postal%40public&rows=1&fields=nom_dept,nom_region,insee_com,code_dept,postal_code,nom_comm&q=(insee_com:${code} OR postal_code:${code})`,
        {
          Authorization: `Apikey ${opendataApiKey}`,
        }
      );
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async findCode(code) {
    try {
      const { records } = await this.searchDataSoft(code);
      if (records.length === 0) {
        return {
          info: "Erreur: Non trouvé",
          value: null,
        };
      }
      const {
        fields: { nom_dept, nom_region, insee_com, code_dept, postal_code, nom_comm },
      } = records[0];
      const value = { nom_dept, nom_region, insee_com, code_dept, postal_code, nom_comm };

      if (insee_com === code) {
        return {
          info: `Update: Le code ${code} est un code commune insee`,
          value,
        };
      }
      return {
        info: "Ok",
        value,
      };
    } catch (error) {
      return error;
    }
  }

  async findNomAcademie(code_dept) {
    const nomAcademie = await apiEsSup.getNomAcademieInfoFromNumDepartement(code_dept);
    if (!nomAcademie) {
      return {
        info: `Impossible de retrouver le nom d'academie du département: ${code_dept}`,
        value: null,
      };
    }
    return {
      info: `Ok`,
      value: nomAcademie,
    };
  }

  async findNumAcademie(code_dept) {
    const numAcademie = await apiEsSup.getNumAcademieInfoFromNumDepartement(code_dept);
    if (!numAcademie) {
      return {
        info: `Impossible de retrouver le numéro d'academie du département: ${code_dept}`,
        value: null,
      };
    }
    return {
      info: `Ok`,
      value: numAcademie,
    };
  }

  async findAcademie(code_dept) {
    const response = await apiEsSup.getInfoFromNumDepartement(code_dept);

    let numAcademie;
    let numAcademieData;
    if (response && response.aca_code) {
      numAcademie = Number.parseInt(response.aca_code);
      numAcademieData = {
        info: "Ok",
        value: numAcademie,
      };
    } else {
      numAcademieData = {
        info: `Impossible de retrouver le numéro d'academie du département: ${code_dept}`,
        value: null,
      };
    }

    let nomAcademie;
    let nomAcademieData;
    if (response && response.aca_nom) {
      nomAcademie = response.aca_nom;
      nomAcademieData = {
        info: "Ok",
        value: nomAcademie,
      };
    } else {
      nomAcademieData = {
        info: `Impossible de retrouver le nom d'academie du département: ${code_dept}`,
        value: null,
      };
    }

    return {
      nomAcademie: nomAcademieData,
      numAcademie: numAcademieData,
    };
  }

  async findGeoCoordinateFromAdresse({ numero_voie, type_voie, nom_voie, code_postal, localite }) {
    const { geo_coordonnees } = await geoAdresseData.getGeoCoordinateFromAdresse({
      numero_voie,
      type_voie,
      nom_voie,
      code_postal,
      localite,
    });
    console.log(geo_coordonnees);
    return {
      info: `Ok`,
      value: geo_coordonnees,
    };
  }

  isValidCodePostal(codePostal) {
    return /^[0-9]{5}$/g.test(codePostal);
  }
}

const geoController = new GeoController();
module.exports = geoController;
