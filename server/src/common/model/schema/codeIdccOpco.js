const codeIdccOpcoSchema = {
  IDCC: {
    type: String,
    default: null,
    description: "Id de la convention collective",
  },
  operateur_de_competences: {
    type: String,
    default: null,
    description: "Nom de l'opérateur de compétences",
  },
  libelle: {
    type: String,
    default: null,
    description: "Libellé de la convention collective",
  },
  obs: {
    type: String,
    default: null,
    description: "Informations complémentaires",
  },
};
module.exports = codeIdccOpcoSchema;
