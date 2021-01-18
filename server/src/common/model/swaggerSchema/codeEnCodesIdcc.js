module.exports = {
  codeEnCodesIdcc: {
    type: "object",
    properties: {
      cfd: {
        type: "string",
        default: "null",
        description: "Code formation diplôme",
      },
      libelle: {
        type: "string",
        default: "null",
        description: "Libellé de la formation",
      },
      codeCPNE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      libelleCPNE: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      codeIDCC: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      valeur_finale: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      statut: {
        type: "string",
        default: "null",
        description: "DESCRIPTION",
      },
      _id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
      },
    },
  },
};
