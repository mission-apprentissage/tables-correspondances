const { oleoduc, csvStream, jsonStream } = require("oleoduc");
const { Annuaire } = require("../../common/model");

module.exports = {
  exportAll: (out, options = {}) => {
    let formatter = options.json
      ? jsonStream()
      : csvStream({
          columns: {
            UAI: (a) => a.uai,
            Siret: (a) => a.siret,
            "Raison sociale": (a) => a.raisonSociale,
            "UAIs secondaires disponibles": (a) => (a.uais_secondaires.length > 0 ? "Oui" : "Non"),
            "UAI secondaires": (a) =>
              a.uais_secondaires
                .map(({ uai, type }) => {
                  return `${uai}_${type}`;
                })
                .join("|"),
          },
        });

    return oleoduc(Annuaire.find().cursor(), formatter, out);
  },
};
