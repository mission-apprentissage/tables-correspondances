module.exports = {
  onisep: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type (etablissement | formation)",
      },
      _id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
      },
    },
    required: ["type"],
  },
};
