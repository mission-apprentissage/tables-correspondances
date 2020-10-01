const mongoose = require("mongoose");
const { mongooseInstance } = require("../mongodb");
const { mongoosastic, getElasticInstance } = require("../esClient");
const { nFormationDiplomeSchema, userSchema } = require("../model/schema");

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

let nFormationDiplomeModel = null;
if (!nFormationDiplomeModel) {
  nFormationDiplomeModel = getModel("nformationdiplome", nFormationDiplomeSchema);
}

let u = null;
if (!u) {
  u = getModel("user", userSchema);
}

let l = null;
if (!l) {
  l = getMongooseModel("log");
}

module.exports = {
  NFormationDiplome: nFormationDiplomeModel,
  User: u,
  Log: l,
};
