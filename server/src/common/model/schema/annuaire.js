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
    description: "L'UAI de l'établissement",
    unique: true,
    sparse: true,
  },
  nom: {
    type: String,
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
    required: true,
    description: "La liste de tous les uais connus pour cet établissement",
  },
  filiations: {
    type: [
      new Schema(
        {
          siret: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            required: true,
          },
          statut: {
            type: String,
            required: true,
          },
          exists: {
            type: Boolean,
            required: true,
          },
        },
        { _id: false }
      ),
    ],
    default: [],
    description: "La liste des établissements liés",
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
      label: {
        type: String,
        required: true,
      },
      numero_voie: {
        type: String,
      },
      type_voie: {
        type: String,
      },
      nom_voie: {
        type: String,
      },
      code_postal: {
        type: String,
        required: true,
      },
      code_insee: {
        type: String,
        required: true,
      },
      cedex: {
        type: String,
      },
      localite: {
        type: String,
        required: true,
      },
      geojson: new Schema(
        {
          type: {
            type: String,
            required: true,
          },
          geometry: new Schema(
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
          properties: {
            type: Object,
          },
        },
        { _id: false }
      ),
    },
    { _id: false }
  ),
};

module.exports = annuaireSchema;
