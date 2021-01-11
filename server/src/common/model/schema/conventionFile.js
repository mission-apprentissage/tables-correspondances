const conventionFileSchema = {
  type: {
    type: String,
    description: "Type de fichier (datadock | DGEFP | DEPP | DATAGOUV)",
    required: true,
  },
};
module.exports = conventionFileSchema;
