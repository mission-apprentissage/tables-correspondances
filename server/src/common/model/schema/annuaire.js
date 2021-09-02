const { Schema } = require("mongoose");

let GeojsonSchema = new Schema(
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
);

let AdresseSchema = new Schema(
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
    region: {
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
    geojson: {
      type: GeojsonSchema,
    },
  },
  { _id: false }
);

const annuaireSchema = {
  __v: { type: Number, select: false },
  siret: {
    type: String,
    required: true,
    description: "Le siret de l'établissement",
    unique: true,
    index: true,
  },
  uai: {
    type: String,
    description: "L'uai de l'établissement",
    unique: true,
    index: true,
    sparse: true,
  },
  raison_sociale: {
    type: String,
    description: "La raison sociale de l'établissement",
  },
  siege_social: {
    type: Boolean,
    required: true,
    description: "Le siège social de l'entreprise",
  },
  statut: {
    type: String,
    required: true,
    description: "Statut de l'entreprise",
  },
  adresse: {
    type: AdresseSchema,
  },
  forme_juridique: {
    description: "Informations relatives à la forme juridique de l'entreprise",
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
  gestionnaire: {
    type: Boolean,
  },
  formateur: {
    type: Boolean,
  },
  referentiels: {
    type: [String],
    required: true,
    description: "Le nom du référentiel depuis lequel a été importé l'établissement",
  },
  reseaux: {
    type: [String],
    default: [],
    description: "Les réseaux auquels appartient l'établissement",
  },
  conformite_reglementaire: {
    description: "Informations relatives à la conformité réglementaire",
    type: new Schema(
      {
        conventionne: {
          type: Boolean,
          default: undefined,
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
  uais: {
    description: "La liste de tous les uais connus pour cet établissement",
    required: true,
    type: [
      new Schema(
        {
          sources: {
            type: [String],
            required: true,
          },
          uai: {
            type: String,
            required: true,
            index: true,
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
          sources: {
            type: [String],
            required: true,
          },
          label: {
            type: String,
            default: undefined,
          },
          type: {
            type: String,
            enum: ["formateur", "gestionnaire", "fille", "mère"],
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
            type: AdresseSchema,
          },
        },
        { _id: false }
      ),
    ],
  },
  certifications: {
    description: "La liste des certifications que l'établissement dispensent",
    required: true,
    default: [],
    type: [
      new Schema(
        {
          code: {
            type: String,
            required: true,
          },
          label: {
            type: String,
            default: undefined,
          },
          type: {
            type: String,
            enum: ["rncp"],
            required: true,
          },
        },
        { _id: false }
      ),
    ],
  },
  diplomes: {
    description: "La liste des diplomes que l'établissement dispensent",
    required: true,
    default: [],
    type: [
      new Schema(
        {
          code: {
            type: String,
            required: true,
          },
          niveau: {
            type: String,
            default: undefined,
          },
          label: {
            type: String,
            default: undefined,
          },
          type: {
            type: String,
            enum: ["cfd"],
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
                job: {
                  type: String,
                  required: true,
                },
                source: {
                  type: String,
                  required: true,
                },
                date: {
                  type: Date,
                  default: () => new Date(),
                  required: true,
                },
                code: {
                  type: String,
                },
                details: {
                  type: String,
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
