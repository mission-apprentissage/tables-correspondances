module.exports = {
  bcnNMef: {
    type: "object",
    properties: {
      MEF: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      DISPOSITIF_FORMATION: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      FORMATION_DIPLOME: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      DUREE_DISPOSITIF: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      ANNEE_DISPOSITIF: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      LIBELLE_COURT: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      LIBELLE_LONG: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      DATE_OUVERTURE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      DATE_FERMETURE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      STATUT_MEF: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      NB_OPTION_OBLIGATOIRE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      NB_OPTION_FACULTATIF: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      RENFORCEMENT_LANGUE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      DUREE_PROJET: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      DUREE_STAGE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      HORAIRE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      MEF_INSCRIPTION_SCOLARITE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      MEF_STAT_11: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      MEF_STAT_9: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      DATE_INTERVENTION: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      NUMERO_COMPTE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      GESTION_DIFFUSION: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      LIBELLE_EDITION: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      ID: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      CREATED_AT: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      UPDATED_AT: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      N_COMMENTAIRE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
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
