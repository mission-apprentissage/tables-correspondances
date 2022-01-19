const conventionFileSchema = {
  type: {
    index: true,
    type: String,
    description: "Type de fichier (DGEFP | DEPP | DATAGOUV)",
    required: true,
  },
  siren: {
    index: true,
    type: String,
  },
  numero_uai: {
    index: true,
    type: String,
  },
  "N° SIREN": {
    index: true,
    type: String,
  },
  "N° Etablissement": {
    index: true,
    type: String,
  },
  siretetablissementdeclarant: {
    index: true,
    type: String,
  },
};
module.exports = conventionFileSchema;
