module.exports = {
  codeIdccOpco: {
    type: "object",
    properties: {
      IDCC: {
        type: "string",
        default: "null",
        description: "Id de la convention collective",
      },
      operateur_de_competences: {
        type: "string",
        default: "null",
        description: "Nom de l'opérateur de compétences",
      },
      libelle: {
        type: "string",
        default: "null",
        description: "Libellé de la convention collective",
      },
      obs: {
        type: "string",
        default: "null",
        description: "Informations complémentaires",
      },
      _id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
      },
    },
  },
};
