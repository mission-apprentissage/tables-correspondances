const regions = require("./regions");
const MIN_GEOCODE_SCORE = 0.6;

class GeocodingError extends Error {
  constructor(latitude, longitude, reason) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = `Adresse inconnue pour les coordonnées ${latitude},${longitude}`;
    this.reason = reason;
  }
}

module.exports = (apiGeoAdresse) => {
  async function reverseGeocodingFallback(error, longitude, latitude, options = {}) {
    let promise = options.label ? apiGeoAdresse.search(options.label) : Promise.reject(error);

    return promise.catch((e) => {
      throw new GeocodingError(longitude, latitude, e.message);
    });
  }

  return {
    getAdresseFromCoordinates: async function (longitude, latitude, options) {
      let results;
      try {
        results = await apiGeoAdresse.reverse(longitude, latitude);
      } catch (e) {
        results = await reverseGeocodingFallback(e, longitude, latitude, options);
      }

      if (results.features.length === 0) {
        throw new GeocodingError(longitude, latitude);
      }

      let best = results.features[0];
      let properties = best.properties;
      let score = properties.score;
      let regionName = properties.context.split(",")[2].trim();
      let region = regions.find((r) => r.label === regionName);

      if (score < MIN_GEOCODE_SCORE) {
        throw new GeocodingError(longitude, latitude);
      } else {
        return {
          label: properties.label,
          code_postal: properties.postcode,
          code_insee: properties.citycode,
          localite: properties.city,
          region: region,
          geojson: {
            type: best.type,
            geometry: best.geometry,
            properties: {
              score,
            },
          },
        };
      }
    },
  };
};
