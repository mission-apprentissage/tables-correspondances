const { oleoduc, transformIntoCSV, transformIntoJSON } = require("oleoduc");
const { Annuaire } = require("../../common/model");

function exportAnnuaire(out, options = {}) {
  let filter = options.filter || {};
  let limit = options.limit || Number.MAX_SAFE_INTEGER;
  let formatter = options.json
    ? transformIntoJSON()
    : transformIntoCSV({
        columns: {
          Siret: (a) => a.siret,
          "Raison sociale": (a) => a.raison_sociale,
          Statut: (a) => a.statut,
          "Code Postal": (a) => a.adresse.code_postal,
          Ville: (a) => a.adresse.localite,
          Reseaux: (a) => a.reseaux.join("|"),
          UAIs: (a) => a.uais.map(({ uai }) => uai).join("|"),
          Sources: (a) => a.uais.flatMap(({ sources }) => sources).join("|"),
        },
      });

  return oleoduc(Annuaire.find(filter).limit(limit).cursor(), formatter, out);
}

module.exports = exportAnnuaire;
