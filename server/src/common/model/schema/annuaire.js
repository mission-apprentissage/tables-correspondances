const annuaireSchema = {
  uai: {
    type: String,
    default: undefined,
    description: "L'UAI de l'établissement",
    unique: true,
  },
  siret: {
    type: String,
    required: true,
    description: "Le siret de l'établissement",
    unique: true,
  },
  nom: {
    type: String,
    default: undefined,
    description: "Le nom de l'établissement",
  },
  referentiel: {
    type: String,
    required: true,
    description: "Le nom du référentiel depuis lequel a été importé l'établissement",
  },
  uais_secondaires: {
    type: Array,
    default: [],
    description: "La liste de tous les uais connus pour cet établissement",
  },
  region: {
    type: String,
    default: undefined,
    description: "Le code la région",
  },
  siegeSocial: {
    type: Boolean,
    default: undefined,
    description: "Le siège social",
  },
  dateCreation: {
    type: Date,
    default: undefined,
    description: "Date de création",
  },
  statut: {
    type: String,
    default: undefined,
    description: "Statut de l'entreprise",
  },
};

module.exports = annuaireSchema;
