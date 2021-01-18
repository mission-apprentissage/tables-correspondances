module.exports = {
  ficheRncp: {
    type: "object",
    properties: {
      cfds: {
        type: "array",
        items: {
          type: "string",
        },
        default: "null",
        description: "Codes formation dilpôme",
      },
      code_rncp: {
        type: "string",
        default: "null",
        description: "Code rncp fiche",
      },
      intitule_diplome: {
        type: "string",
        default: "null",
        description: "Intitulé diplôme",
      },
      date_fin_validite_enregistrement: {
        type: "string",
        default: "null",
        description: "Date de validité de la fiche",
      },
      active_inactive: {
        type: "string",
        default: "null",
        description: "fiche active ou non",
      },
      etat_fiche_rncp: {
        type: "string",
        default: "null",
        description: "état fiche ex: Publiée",
      },
      niveau_europe: {
        type: "string",
        default: "null",
        description: "Niveau europeen ex: niveauu5",
      },
      code_type_certif: {
        type: "string",
        default: "null",
        description: "Code type de certification (ex: DE)",
      },
      type_certif: {
        type: "string",
        default: "null",
        description: "Type de certification (ex: diplome d'etat)",
      },
      ancienne_fiche: {
        type: "array",
        items: {
          type: "string",
        },
        default: "null",
        description: "Code rncp de l'ancienne fiche",
      },
      nouvelle_fiche: {
        type: "array",
        items: {
          type: "string",
        },
        default: "null",
        description: "Code rncp de la nouvelle fiche",
      },
      demande: {
        type: "number",
        default: 0,
        description: "demande en cours de d'habilitation",
      },
      certificateurs: {
        type: "array",
        items: {},
        default: [],
        description: "Certificateurs",
      },
      nsf_code: {
        type: "string",
        default: "null",
        description: "code NSF",
      },
      nsf_libelle: {
        type: "string",
        default: "null",
        description: "libéllé NSF",
      },
      romes: {
        type: "array",
        items: {},
        default: [],
        description: "Romes",
      },
      blocs_competences: {
        type: "array",
        items: {},
        default: [],
        description: "Blocs de compétences",
      },
      voix_acces: {
        type: "array",
        items: {},
        default: [],
        description: "voix d'accès",
      },
      partenaires: {
        type: "array",
        items: {},
        default: [],
        description: "partenaires",
      },
      type_enregistrement: {
        type: "string",
        default: "null",
        description: "de droit ou sur demande",
      },
      si_jury_ca: {
        type: "string",
        default: "null",
        description: "Validation du jury",
      },
      eligible_apprentissage: {
        type: "boolean",
        default: false,
        description: "éligible à l'apprentissage",
      },
      created_at: {
        type: "string",
        description: "Date d'ajout en base de données",
        format: "date-time",
      },
      last_update_at: {
        type: "string",
        description: "Date de dernières mise à jour",
        format: "date-time",
      },
      _id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
      },
    },
  },
};
