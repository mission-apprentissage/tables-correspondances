const { Schema } = require("mongoose");

let adresse = new Schema(
  {
    label: {
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
);

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
  raison_sociale: {
    type: String,
    description: "La raison sociale de l'établissement",
  },
  referentiel: {
    type: String,
    required: true,
    description: "Le nom du référentiel depuis lequel a été importé l'établissement",
  },
  siege_social: {
    type: Boolean,
    required: true,
    description: "Le siège social",
  },
  statut: {
    type: String,
    required: true,
    description: "Statut de l'entreprise",
  },
  reseaux: {
    type: Array,
    default: [],
    description: "Les réseaux auquels appartient l'établissement",
  },
  academie: {
    type: new Schema(
      {
        code: {
          type: String,
          required: true,
        },
        nom: {
          type: String,
          required: true,
        },
      },
      { _id: false }
    ),
  },
  adresse: {
    default: undefined,
    type: adresse,
  },
  forme_juridique: {
    description: "Informations relatives à la forme juridique de l'établissement",
    type: new Schema(
      {
        code: {
          type: String,
          required: true,
          description: "Le code la forme juridique",
        },
        label: {
          type: String,
          required: true,
          description: "Le nom de la forme juridique",
        },
      },
      { _id: false }
    ),
  },
  conformite_reglementaire: {
    description: "Informations relatives à la conformité réglementaire",
    type: new Schema(
      {
        conventionne: {
          type: Boolean,
          default: false,
          description: "True si l'établissement est conventionné",
        },
        certificateur: {
          type: String,
          default: undefined,
          description: "Le nom du certificateur",
        },
      },
      { _id: false }
    ),
  },
  uais_secondaires: {
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
          annuaire: {
            type: Boolean,
            required: true,
          },
          source: {
            type: String,
            required: true,
          },
          label: {
            type: String,
            default: undefined,
          },
          type: {
            type: String,
            default: undefined,
          },
        },
        { _id: false }
      ),
    ],
  },
  lieux_de_formation: {
    description: "La liste des lieux dans lesquels l'établissement dispense des formations",
    required: true,
    default: [],
    type: [
      new Schema(
        {
          siret: {
            type: String,
            default: undefined,
          },
          adresse: {
            required: true,
            type: adresse,
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
        created_at: {
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
                details: {
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
