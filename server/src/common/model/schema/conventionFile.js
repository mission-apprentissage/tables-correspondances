const conventionFileSchema = {
  type: {
    index: true,
    type: String,
    description: "Type de fichier (DGEFP | DEPP | DATAGOUV)",
    required: true,
  },
};
module.exports = conventionFileSchema;
