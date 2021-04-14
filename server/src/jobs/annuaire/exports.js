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
            UAIs: (a) => a.uais.map(({ uai }) => uai).join("|"),
            Sources: (a) => a.uais.map(({ type }) => type).join("|"),
          },
        });

    return oleoduc(Annuaire.find(filter).limit(limit).cursor(), formatter, out);
  },
};
