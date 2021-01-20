const annuaireSchema = {
  uai: {
    type: String,
    default: null,
    description: "L'UAI de l'établissement",
  },
  siret: {
    type: String,
    default: null,
    description: "Le siret de l'établissement",
  },
  nom: {
    type: String,
    default: null,
    description: "Le nom de l'établissement",
  },
  uais_secondaires: {
    type: Array,
    default: [],
    description: "La liste de tous les uais connus pour cet établissement",
  },
};

module.exports = annuaireSchema;
