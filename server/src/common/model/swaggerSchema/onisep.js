module.exports = {
  onisep: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type (etablissement | formation)",
      },
      code_uai: {
        type: "string",
        description: "uai",
      },
      academie: {
        type: "string",
        description: "academie",
      },
      code_mef: {
        type: "string",
        description: "Code Mef",
      },
      code_formation_diplome: {
        type: "string",
        description: "Code formation diplome (EN)",
      },
      libelle_formation_principal: {
        type: "string",
      },
      libelle_poursuite: {
        type: "string",
      },
      lien_site_onisepfr: {
        type: "string",
      },
      discipline: {
        type: "string",
      },
      domaine_sousdomaine: {
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
