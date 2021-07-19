const { getMongooseInstance } = require("../mongodb");
const { mongoosastic, getElasticInstance } = require("../esClient");
const schema = require("../model/schema");

const mongoose = getMongooseInstance();

const createModel = (modelName, descriptor, options = {}) => {
  try {
    const schema = new mongoose.Schema(descriptor, options.schemaOptions || {});
    schema.plugin(require("mongoose-paginate"));
    if (options.esIndexName && !mongoose.isElasticDisabled) {
      schema.plugin(mongoosastic, { esClient: getElasticInstance(), index: options.esIndexName });
    }
    if (options.createMongoDBIndexes) {
      options.createMongoDBIndexes(schema);
    }
    return mongoose.model(modelName, schema, options.collectionName);
  } catch (error) {
    if (error.name === "OverwriteModelError") {
      console.log(`Model ${modelName} seems to be already declared`);
      return mongoose.models[modelName];
    } else {
      console.log(error);
    }
  }
};

module.exports = {
  User: createModel("user", schema.userSchema),
  Log: createModel("log", schema.logSchema),
  Annuaire: createModel("annuaire", schema.annuaireSchema, {
    collectionName: "annuaire",
    createMongoDBIndexes: (schema) => {
      schema.index({ "$**": "text" }, { default_language: "french" });
    },
  }),
  AnnuaireStats: createModel("annuaireStats", schema.annuaireStatsSchema, {
    collectionName: "annuaireStats",
    schemaOptions: {
      strict: false,
    },
  }),
  FicheRncp: createModel("ficherncp", schema.ficheRncpSchema),
  ConventionFile: createModel("conventionfile", schema.conventionFileSchema),
  Onisep: createModel("onisep", schema.onisepSchema),
  CodeIdccOpco: createModel("codeIdccOpco", schema.codeIdccOpcoSchema),
  CodeEnCodesIdcc: createModel("codeEnCodesIdcc", schema.codeEnCodesIdccSchema),
  BcnFormationDiplome: createModel("bcnformationdiplome", schema.bcnFormationDiplomesSchema, {
    esIndexName: "bcnformationdiplomes",
  }),
  BcnLettreSpecialite: createModel("bcnlettrespecialite", schema.bcnLettreSpecialiteSchema, {
    esIndexName: "bcnlettrespecialites",
  }),
  BcnNNiveauFormationDiplome: createModel("bcnnniveauformationdiplome", schema.bcnNNiveauFormationDiplomeSchema, {
    esIndexName: "bcnnniveauformationdiplomes",
  }),
  BcnNMef: createModel("bcnnmef", schema.bcnNMefSchema, {
    esIndexName: "bcnnmefs",
  }),
  BcnNDispositifFormation: createModel("bcnndispositifformation", schema.bcnNDispositifFormationSchema, {
    esIndexName: "bcnndispositifformations",
  }),
  DomainesMetiers: createModel("domainesmetiers", schema.domainesMetiersSchema, {
    esIndexName: "domainesmetiers",
  }),
  Etablissement: createModel("etablissement", schema.etablissementSchema, {
    esIndexName: "etablissements",
    createMongoDBIndexes: (schema) => {
      schema.index({ adresse: "text" });
    },
  }),
};
