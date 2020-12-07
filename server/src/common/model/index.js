const mongoose = require("mongoose");
const { mongooseInstance } = require("../mongodb");
const { mongoosastic, getElasticInstance } = require("../esClient");
const {
  bcnFormationDiplomesSchema,
  userSchema,
  domainesMetiersSchema,
  ficheRncpSchema,
  bcnLettreSpecialiteSchema,
  bcnNNiveauFormationDiplomeSchema,
  bcnNMefSchema,
  bcnNDispositifFormationSchema,
  etablissementSchema,
} = require("../model/schema");

const getMongoostaticModel = (modelName, schema, instanceMongoose = mongooseInstance) => {
  const Schema = new instanceMongoose.Schema(schema);
  Schema.plugin(mongoosastic, { esClient: getElasticInstance(), index: modelName });
  Schema.plugin(require("mongoose-paginate"));
  return mongooseInstance.model(modelName, Schema);
};

const getMongooseModel = (modelName, callback = () => ({})) => {
  const modelSchema = new mongoose.Schema(require(`./schema/${modelName}`));
  callback(modelSchema);
  return mongoose.model(modelName, modelSchema, modelName);
};

const getModel = (modelName, schema, instanceMongoose = mongooseInstance) => {
  if (instanceMongoose) return getMongoostaticModel(modelName, schema);
  return getMongooseModel(modelName);
};

let bcnFormationDiplomesModel = null;
if (!bcnFormationDiplomesModel) {
  bcnFormationDiplomesModel = getModel("bcnformationdiplome", bcnFormationDiplomesSchema);
}

let bcnLettreSpecialiteModel = null;
if (!bcnLettreSpecialiteModel) {
  bcnLettreSpecialiteModel = getModel("bcnlettrespecialite", bcnLettreSpecialiteSchema);
}

let bcnNNiveauFormationDiplomeModel = null;
if (!bcnNNiveauFormationDiplomeModel) {
  bcnNNiveauFormationDiplomeModel = getModel("bcnnniveauformationdiplome", bcnNNiveauFormationDiplomeSchema);
}

let bcnNMefModel = null;
if (!bcnNMefModel) {
  bcnNMefModel = getModel("bcnnmef", bcnNMefSchema);
}

let bcnNDispositifFormationModel = null;
if (!bcnNDispositifFormationModel) {
  bcnNDispositifFormationModel = getModel("bcnndispositifformation", bcnNDispositifFormationSchema);
}

let etablissementModel = null;
if (!etablissementModel) {
  etablissementModel = getModel("etablissements", etablissementSchema);
}

let u = null;
if (!u) {
  u = getModel("user", userSchema);
}

let l = null;
if (!l) {
  l = getMongooseModel("log");
}

let d = null;
if (!d) {
  d = getModel("domainesmetiers", domainesMetiersSchema);
}

let f = null;
if (!f) {
  f = getModel("ficherncp", ficheRncpSchema);
}

module.exports = {
  BcnFormationDiplome: bcnFormationDiplomesModel,
  BcnLettreSpecialite: bcnLettreSpecialiteModel,
  BcnNNiveauFormationDiplome: bcnNNiveauFormationDiplomeModel,
  BcnNMef: bcnNMefModel,
  BcnNDispositifFormation: bcnNDispositifFormationModel,
  User: u,
  Log: l,
  DomainesMetiers: d,
  FicheRncp: f,
  Etablissement: etablissementModel,
};
