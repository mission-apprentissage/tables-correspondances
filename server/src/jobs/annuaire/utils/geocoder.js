const MIN_GEOCODE_SCORE = 0.6;

class ReverseGeocodingError extends Error {
  constructor(latitude, longitude) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = `Adresse inconnue pour les coordonnées ${latitude},${longitude}`;
  }
}

module.exports = (apiGeoAdresse) => {
  return {
    async getAdresseFromCoordinates(longitude, latitude) {
      let results = await apiGeoAdresse.reverse(longitude, latitude);

      if (results.features.length === 0) {
        throw new ReverseGeocodingError(longitude, latitude);
      }

      let best = results.features[0];
      let properties = best.properties;
      let score = properties.score;

      if (score < MIN_GEOCODE_SCORE) {
        throw new ReverseGeocodingError(longitude, latitude);
      } else {
        return {
          label: properties.label,
          code_postal: properties.postcode,
          code_insee: properties.citycode,
          localite: properties.city,
          cedex: properties.cedex,
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
