const { oleoduc, transformData, readLineByLine } = require("oleoduc");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "acce";
  let input = custom.input || (await getOvhFileAsStream("annuaire/acce-20210428.ndjson"));

  return {
    name,
    stream() {
      return oleoduc(
        input,
        readLineByLine(),
        transformData((line) => {
          let json = JSON.parse(line);
          if (!json.geojson) {
            return;
          }

          return {
            source: name,
            selector: {
              "adresse.geojson.geometry": {
                $near: {
                  $geometry: json.geojson.geometry,
                  $maxDistance: 10, //meters
                },
              },
            },
            uais: [json.uai],
          };
        }),
        { promisify: false }
      );
    },
  };
};
