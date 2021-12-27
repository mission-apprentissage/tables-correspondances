const onisepSchema = {
  type: {
    index: true,
    type: String,
    description: "Type (etablissement | formation)",
    required: true,
  },
  code_uai: {
    index: true,
    type: String,
    description: "uai",
  },
  academie: {
    index: true,
    type: String,
    description: "academie",
  },
  code_mef: {
    index: true,
    type: String,
    description: "Code Mef",
  },
  code_formation_diplome: {
    index: true,
    type: String,
    description: "Code formation diplome (EN)",
  },
  libelle_formation_principal: {
    type: String,
    description: "",
  },
  libelle_poursuite: {
    type: String,
    description: "",
  },
  lien_site_onisepfr: {
    type: String,
    description: "",
  },
  discipline: {
    type: String,
    description: "",
  },
  domaine_sousdomaine: {
    type: String,
    description: "",
  },
};
module.exports = onisepSchema;
