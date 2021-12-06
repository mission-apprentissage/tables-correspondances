const conventionFileSchema = {
  type: {
    index: true,
    type: String,
    description: "Type de fichier (datadock | DGEFP | DEPP | DATAGOUV)",
    required: true,
  },
};
module.exports = conventionFileSchema;
