const { getMongooseInstance } = require("../mongodb");
const schema = require("../model/schema");

const mongoose = getMongooseInstance();

const createModel = (modelName, descriptor, options = {}) => {
  try {
    const schema = new mongoose.Schema(descriptor, options.schemaOptions || {});
    schema.plugin(require("mongoose-paginate"));
    if (options.createMongoDBIndexes) {
      options.createMongoDBIndexes(schema);
    }
    return mongoose.model(modelName, schema, options.collectionName);
  } catch (error) {
    if (error.name === "OverwriteModelError") {
      // console.log(`Model ${modelName} seems to be already declared`);
      return mongoose.models[modelName];
    } else {
      console.log(error);
    }
  }
};

module.exports = {
  User: createModel("user", schema.userSchema),
  Log: createModel("log", schema.logSchema),
  FicheRncp: createModel("ficherncp", schema.ficheRncpSchema),
  ConventionFile: createModel("conventionfile", schema.conventionFileSchema),
  Onisep: createModel("onisep", schema.onisepSchema),
  CodeIdccOpco: createModel("codeIdccOpco", schema.codeIdccOpcoSchema),
  CodeEnCodesIdcc: createModel("codeEnCodesIdcc", schema.codeEnCodesIdccSchema),
  BcnFormationDiplome: createModel("bcnformationdiplome", schema.bcnFormationDiplomesSchema),
  BcnLettreSpecialite: createModel("bcnlettrespecialite", schema.bcnLettreSpecialiteSchema),
  BcnNNiveauFormationDiplome: createModel("bcnnniveauformationdiplome", schema.bcnNNiveauFormationDiplomeSchema),
  BcnNMef: createModel("bcnnmef", schema.bcnNMefSchema),
  BcnNDispositifFormation: createModel("bcnndispositifformation", schema.bcnNDispositifFormationSchema),
  DomainesMetiers: createModel("domainesmetiers", schema.domainesMetiersSchema),
};
