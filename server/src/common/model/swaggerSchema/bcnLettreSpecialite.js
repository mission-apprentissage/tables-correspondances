module.exports = {
  bcnLettreSpecialite: {
    type: "object",
    properties: {
      LETTRE_SPECIALITE: {
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
