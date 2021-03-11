const { oleoduc, transformIntoCSV, transformIntoJSON } = require("oleoduc");
const { Annuaire } = require("../../common/model");

module.exports = {
  exportAnnuaire: (out, options = {}) => {
    let filter = options.filter || {};
    let limit = options.limit || Number.MAX_SAFE_INTEGER;
    let formatter = options.json
      ? transformIntoJSON()
      : transformIntoCSV({
          columns: {
            Siret: (a) => a.siret,
            "Raison sociale": (a) => a.raison_sociale,
            UAI: (a) => a.uai,
            "UAIs secondaires disponibles": (a) => (a.uais_secondaires.length > 0 ? "Oui" : "Non"),
            "UAI secondaires": (a) => a.uais_secondaires.map(({ uai }) => uai).join("|"),
            Sources: (a) => a.uais_secondaires.map(({ type }) => type).join("|"),
          },
        });

    return oleoduc(Annuaire.find(filter).limit(limit).cursor(), formatter, out);
  },
};
