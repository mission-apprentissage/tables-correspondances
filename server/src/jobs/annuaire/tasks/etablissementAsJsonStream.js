const { pick } = require("lodash");
const { oleoduc, transformData, transformIntoJSON } = require("oleoduc");
const { Annuaire } = require("../../../common/model");

function etablissementAsJsonStream(options = {}) {
  let filter = options.filter || {};
  let limit = options.limit || Number.MAX_SAFE_INTEGER;

  return oleoduc(
    Annuaire.find(filter).limit(limit).cursor(),
    transformData((data) => {
      return {
        siret: data.siret,
        raison_sociale: data.raison_sociale,
        uais: data.uais.map((u) => u.uai),
        gestionnaire: data.gestionnaire,
        formateur: data.formateur,
        statut: data.statut,
        relations: data.relations.map((relation) => pick(relation, ["siret", "label", "type"])),
        ...(data.adresse ? { adresse: pick(data.adresse, ["code_insee", "code_postal", "label", "region"]) } : {}),
      };
    }),
    transformIntoJSON(),
    { promisify: false }
  );
}

module.exports = etablissementAsJsonStream;
