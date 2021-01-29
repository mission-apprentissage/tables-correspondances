const { Schema } = require("mongoose");

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
  sirene: new Schema(
    {
      siegeSocial: {
        type: Boolean,
        default: null,
        description: "Le siège social",
      },
      dateCreation: {
        type: Date,
        default: null,
        description: "Date de création",
      },
      statut: {
        type: String,
        default: null,
        description: "Statut de l'entreprise",
      },
    },
    { _id: false }
  ),
};

module.exports = annuaireSchema;
