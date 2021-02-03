const { Schema } = require("mongoose");

const annuaireSchema = {
  siret: {
    type: String,
    required: true,
    description: "Le siret de l'établissement",
    unique: true,
  },
  uai: {
    type: String,
    default: undefined,
    description: "L'UAI de l'établissement",
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
  siegeSocial: {
    type: Boolean,
    required: true,
    description: "Le siège social",
  },
  statut: {
    type: String,
    required: true,
    description: "Statut de l'entreprise",
  },
  adresse: new Schema(
    {
      position: new Schema(
        {
          type: {
            type: String,
            required: true,
          },
          coordinates: {
            type: Array,
            required: true,
          },
        },
        { _id: false }
      ),
      label: {
        type: String,
        required: true,
      },
      numero_voie: {
        type: String,
        required: true,
      },
      type_voie: {
        type: String,
        required: true,
      },
      nom_voie: {
        type: String,
        required: true,
      },
      code_postal: {
        type: String,
        required: true,
      },
      localite: {
        type: String,
        required: true,
      },
      code_insee_localite: {
        type: String,
        required: true,
      },
      region: {
        type: String,
        required: true,
      },
    },
    { _id: false }
  ),
};

module.exports = annuaireSchema;
