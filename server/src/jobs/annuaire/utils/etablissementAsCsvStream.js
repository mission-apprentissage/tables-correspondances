const { oleoduc, transformIntoCSV } = require("oleoduc");
const { Annuaire } = require("../../../common/model");

function etablissementAsCsvStream(options = {}) {
  let filter = options.filter || {};
  let limit = options.limit || Number.MAX_SAFE_INTEGER;

  return oleoduc(
    Annuaire.find(filter).limit(limit).cursor(),
    transformIntoCSV({
      columns: {
        Siret: (a) => a.siret,
        "Raison sociale": (a) => a.raison_sociale,
        Statut: (a) => a.statut,
        "Code Postal": (a) => (a.adresse ? a.adresse.code_postal : ""),
        Ville: (a) => (a.adresse ? a.adresse.localite : ""),
        Reseaux: (a) => a.reseaux.join("|"),
        UAIs: (a) => a.uais.map(({ uai }) => uai).join("|"),
        Sources: (a) => a.uais.flatMap(({ sources }) => sources).join("|"),
      },
    }),
    { promisify: false }
  );
}

module.exports = etablissementAsCsvStream;
