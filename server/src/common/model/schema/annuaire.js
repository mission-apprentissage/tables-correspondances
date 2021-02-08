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
    sparse: true,
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
      postale: {
        type: String,
        required: true,
      },
      numero_voie: {
        type: String,
        default: undefined,
      },
      type_voie: {
        type: String,
        default: undefined,
      },
      nom_voie: {
        type: String,
        default: undefined,
      },
      code_postal: {
        type: String,
        default: undefined,
      },
      code_insee: {
        type: String,
        default: undefined,
      },
      cedex: {
        type: String,
        default: undefined,
      },
      localite: {
        type: String,
        required: true,
      },
      region: {
        type: String,
        required: true,
      },
      geocoding: new Schema(
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
          description: {
            type: String,
            required: true,
          },
        },
        { _id: false }
      ),
    },
    { _id: false }
  ),
};

module.exports = annuaireSchema;
