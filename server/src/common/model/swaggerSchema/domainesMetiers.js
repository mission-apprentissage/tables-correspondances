module.exports = {
  domainesMetiers: {
    type: "object",
    properties: {
      sous_domaine: {
        type: "string",
        default: "null",
        description: "Le sous-domaine d'un métier",
      },
      domaine: {
        type: "string",
        default: "null",
        description: "Le grand domaine d'un métier",
      },
      domaines: {
        type: "array",
        items: {
          type: "string",
        },
        default: [],
        description: "Les domaines d'un métier",
      },
      familles: {
        type: "array",
        items: {
          type: "string",
        },
        default: [],
        description: "Les familles associées au métier",
      },
      codes_romes: {
        type: "array",
        items: {
          type: "string",
        },
        default: [],
        description: "Les codes Romes associés au métier",
      },
      intitules_romes: {
        type: "array",
        items: {
          type: "string",
        },
        default: [],
        description: "Les libellés des codes ROMEs associés au métier",
      },
      mots_clefs: {
        type: "string",
        default: "null",
        description: "Les mots clefs associés au métier",
      },
      couples_romes_metiers: {
        type: "array",
        items: {},
        default: [],
        description: "Couples codes ROMEs / intitulés correspondants au métier",
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
