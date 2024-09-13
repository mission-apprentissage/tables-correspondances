module.exports = {
  conventionFile: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type de fichier (DATAGOUV)",
      },
      siren: {
        type: "string",
      },
      numero_uai: {
        type: "string",
      },
      "N° SIREN": {
        type: "string",
      },
      "N° Etablissement": {
        type: "string",
      },
      siretetablissementdeclarant: {
        type: "string",
      },
      _id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
      },
    },
    required: ["type"],
  },
};
