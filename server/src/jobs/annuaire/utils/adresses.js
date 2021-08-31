const { findRegionByName } = require("./regions");
const { findAcademieByCodeInsee } = require("./academies");
const { pick } = require("lodash");
const MIN_GEOCODE_SCORE = 0.6;

class GeocodingError extends Error {
  constructor(message, reason) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = `Adresse inconnue ${message}`;
    this.reason = reason;
  }
}

function selectBestResults(results, adresse) {
  let best = results.features[0];
  if (!best || best.properties.score < MIN_GEOCODE_SCORE) {
    throw new GeocodingError(`Score trop faible pour l'adresse ${adresse}`);
  }

  let properties = best.properties;
  let context = properties.context.split(",");
  let regionName = context[context.length - 1].trim();
  let codeInsee = properties.citycode;
  return {
    label: properties.label,
    code_postal: properties.postcode,
    code_insee: codeInsee,
    localite: properties.city,
    region: pick(findRegionByName(regionName), ["code", "nom"]),
    academie: pick(findAcademieByCodeInsee(codeInsee), ["code", "nom"]),
    geojson: {
      type: best.type,
      geometry: best.geometry,
      properties: {
        score: properties.score,
      },
    },
  };
}

module.exports = (apiGeoAdresse) => {
  async function reverseGeocodingFallback(error, longitude, latitude, label) {
    let promise = label ? apiGeoAdresse.search(label) : Promise.reject(error);

    return promise.catch((e) => {
      throw new GeocodingError(`[${longitude},${latitude}]`, e.message);
    });
  }

  return {
    async getAdresseFromLabel(label, options) {
      let results = await apiGeoAdresse.search(label, options);

      return selectBestResults(results, label);
    },
    async getAdresseFromCoordinates(longitude, latitude, options) {
      let results;
      try {
        results = await apiGeoAdresse.reverse(longitude, latitude);
      } catch (e) {
        results = await reverseGeocodingFallback(e, longitude, latitude, options.label);
      }

      return selectBestResults(results, `[${longitude},${latitude}]`);
    },
  };
};
