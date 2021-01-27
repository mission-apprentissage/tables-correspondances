const annuaireSchema = {
  uai: {
    type: String,
    default: null,
    description: "L'UAI de l'établissement",
    unique: true,
  },
  siret: {
    type: String,
    default: null,
    description: "Le siret de l'établissement",
    unique: true,
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
