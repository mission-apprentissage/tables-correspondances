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
  raisonSociale: {
    type: String,
    description: "La raison sociale de l'établissement",
  },
  referentiel: {
    type: String,
    required: true,
    description: "Le nom du référentiel depuis lequel a été importé l'établissement",
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
  adresse: {
    type: new Schema(
      {
        label: {
          type: String,
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
        geojson: {
          type: new Schema(
            {
              type: {
                type: String,
                required: true,
              },
              geometry: {
                type: new Schema(
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
              },
              properties: {
                type: Object,
              },
            },
            { _id: false }
          ),
        },
      },
      { _id: false }
    ),
  },
  uaisSecondaires: {
    description: "La liste de tous les uais connus pour cet établissement",
    required: true,
    type: [
      new Schema(
        {
          type: {
            type: String,
            required: true,
          },
          uai: {
            type: String,
            required: true,
          },
          valide: {
            type: Boolean,
            required: true,
          },
        },
        { _id: false }
      ),
    ],
  },
  relations: {
    description: "La liste des établissements liés",
    required: true,
    default: [],
    type: [
      new Schema(
        {
          siret: {
            type: String,
            required: true,
          },
          raisonSociale: {
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
  },
  _meta: {
    required: true,
    default: {},
    type: new Schema(
      {
        lastUpdate: {
          description: "Dernière date de mise à jour du document",
          type: Date,
          required: true,
          default: () => new Date(),
        },
        anomalies: {
          description: "La liste des anomalies survenues durant la collecte",
          required: true,
          type: [
            new Schema(
              {
                type: {
                  type: String,
                  required: true,
                },
                source: {
                  type: String,
                  required: true,
                },
                reason: {
                  type: String,
                },
                date: {
                  type: Date,
                  default: () => new Date(),
                  required: true,
                },
              },
              { _id: false }
            ),
          ],
        },
      },
      { _id: false }
    ),
  },
};

module.exports = annuaireSchema;
