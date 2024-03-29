module.exports = {
  conventionFile: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type de fichier (DATAGOUV)",
      },
      _id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
      },
    },
    required: ["type"],
  },
};
