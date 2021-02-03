const { oleoduc, csvStream, jsonStream } = require("oleoduc");
const { Annuaire } = require("../../common/model");

module.exports = {
  exportAll: (out, options = {}) => {
    let formatter = options.json
      ? jsonStream()
      : csvStream({
          columns: {
            uai: (a) => a.uai,
            siret: (a) => a.siret,
            nom: (a) => a.nom,
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
