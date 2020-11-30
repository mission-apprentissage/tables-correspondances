const ficheRncpSchema = {
  cfds: {
    type: [String],
    default: null,
    description: "Codes formation dilpôme",
  },
  code_rncp: {
    type: String,
    default: null,
    description: "Code rncp fiche",
  },
  intitule_diplome: {
    type: String,
    default: null,
    description: "Intitulé diplôme",
  },
  date_fin_validite_enregistrement: {
    type: String,
    default: null,
    description: "Date de validité de la fiche",
  },
  active_inactive: {
    type: String,
    default: null,
    description: "fiche active ou non",
  },
  etat_fiche_rncp: {
    type: String,
    default: null,
    description: "état fiche ex: Publiée",
  },
  niveau_europe: {
    type: String,
    default: null,
    description: "Niveau europeen ex: niveauu5",
  },
  code_type_certif: {
    type: String,
    default: null,
    description: "Code type de certification (ex: DE)",
  },
  type_certif: {
    type: String,
    default: null,
    description: "Type de certification (ex: diplome d'etat)",
  },
  ancienne_fiche: {
    type: [String],
    default: null,
    description: "Code rncp de l'ancienne fiche",
  },
  nouvelle_fiche: {
    type: [String],
    default: null,
    description: "Code rncp de la nouvelle fiche",
  },
  demande: {
    type: Number,
    default: 0,
    description: "demande en cours de d'habilitation",
  },
  certificateurs: {
    type: [Object],
    default: [],
    description: "Certificateurs",
  },
  nsf_code: {
    type: String,
    default: null,
    description: "code NSF",
  },
  nsf_libelle: {
    type: String,
    default: null,
    description: "libéllé NSF",
  },
  romes: {
    type: [Object],
    default: [],
    description: "Romes",
  },
  blocs_competences: {
    type: [Object],
    default: [],
    description: "Blocs de compétences",
  },
  voix_acces: {
    type: [Object],
    default: [],
    description: "voix d'accès",
  },
  partenaires: {
    type: [Object],
    default: [],
    description: "partenaires",
  },
  type_enregistrement: {
    type: String,
    default: null,
    description: "de droit ou sur demande",
  },
  si_jury_ca: {
    type: String,
    default: null,
    description: "Validation du jury",
  },
  eligible_apprentissage: {
    type: Boolean,
    default: false,
    description: "éligible à l'apprentissage",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date d'ajout en base de données",
  },
  last_update_at: {
    type: Date,
    default: Date.now,
    description: "Date de dernières mise à jour",
  },
};

module.exports = ficheRncpSchema;
