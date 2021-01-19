const { mongoose } = require("../mongodb");
const { mongoosastic, getElasticInstance } = require("../esClient");
const schema = require("../model/schema");

const createModelWithES = (modelName, schema, createMongoDBIndexes = () => ({})) => {
  const Schema = new mongoose.Schema(schema);
  Schema.plugin(mongoosastic, { esClient: getElasticInstance(), index: modelName });
  Schema.plugin(require("mongoose-paginate"));
  createMongoDBIndexes(Schema);
  return mongoose.model(modelName, Schema);
};

const createModel = (modelName, schema) => {
  return mongoose.model(modelName, schema);
};

module.exports = {
  User: createModel("user", schema.userSchema),
  Log: createModel("log", schema.logSchema),
  BcnFormationDiplome: createModelWithES("bcnformationdiplome", schema.bcnFormationDiplomesSchema),
  BcnLettreSpecialite: createModelWithES("bcnlettrespecialite", schema.bcnLettreSpecialiteSchema),
  BcnNNiveauFormationDiplome: createModelWithES("bcnnniveauformationdiplome", schema.bcnNNiveauFormationDiplomeSchema),
  BcnNMef: createModelWithES("bcnnmef", schema.bcnNMefSchema),
  BcnNDispositifFormation: createModelWithES("bcnndispositifformation", schema.bcnNDispositifFormationSchema),
  FicheRncp: createModel("ficherncp", schema.ficheRncpSchema),
  ConventionFile: createModel("conventionfile", schema.conventionFileSchema),
  CodeIdccOpco: createModel("codeIdccOpco", schema.codeIdccOpcoSchema),
  CodeEnCodesIdcc: createModel("codeEnCodesIdcc", schema.codeEnCodesIdccSchema),
  DomainesMetiers: createModelWithES("domainesmetiers", schema.domainesMetiersSchema),
  Etablissement: createModelWithES("etablissement", schema.etablissementSchema, (schema) => {
    schema.index({ adresse: "text" });
  }),
};
