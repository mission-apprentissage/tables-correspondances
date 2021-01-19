const { mongoose } = require("../mongodb");
const { mongoosastic, getElasticInstance } = require("../esClient");
const schema = require("../model/schema");

const createModelWithES = (modelName, schema, esIndexName, createMongoDBIndexes = () => ({})) => {
  const Schema = new mongoose.Schema(schema);
  Schema.plugin(mongoosastic, { esClient: getElasticInstance(), index: esIndexName });
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
  BcnFormationDiplome: createModel("bcnformationdiplome", schema.bcnFormationDiplomesSchema),
  BcnLettreSpecialite: createModel("bcnlettrespecialite", schema.bcnLettreSpecialiteSchema),
  BcnNNiveauFormationDiplome: createModel("bcnnniveauformationdiplome", schema.bcnNNiveauFormationDiplomeSchema),
  BcnNMef: createModel("bcnnmef", schema.bcnNMefSchema),
  BcnNDispositifFormation: createModel("bcnndispositifformation", schema.bcnNDispositifFormationSchema),
  FicheRncp: createModel("ficherncp", schema.ficheRncpSchema),
  ConventionFile: createModel("conventionfile", schema.conventionFileSchema),
  CodeIdccOpco: createModel("codeIdccOpco", schema.codeIdccOpcoSchema),
  CodeEnCodesIdcc: createModel("codeEnCodesIdcc", schema.codeEnCodesIdccSchema),
  DomainesMetiers: createModelWithES("domainesmetiers", schema.domainesMetiersSchema, "domainesmetiers"),
  Etablissement: createModelWithES("etablissement", schema.etablissementSchema, "etablissements", (schema) => {
    schema.index({ adresse: "text" });
  }),
};
