const logSchema = require("./log");
const bcnFormationDiplomesSchema = require("./bcnFormationDiplomesSchema");
const userSchema = require("./user");
const domainesMetiersSchema = require("./domainesmetiers");
const ficheRncpSchema = require("./ficheRncp");

const bcnLettreSpecialiteSchema = require("./bcnLettreSpecialite");
const bcnNNiveauFormationDiplomeSchema = require("./bcnNNiveauFormationDiplome");
const bcnNMefSchema = require("./bcnNMef");
const bcnNDispositifFormationSchema = require("./bcnNDispositifFormation");

const codeIdccOpcoSchema = require("./codeIdccOpco");
const codeEnCodesIdccSchema = require("./codeEnCodesIdcc");

module.exports = {
  bcnFormationDiplomesSchema,
  bcnLettreSpecialiteSchema,
  bcnNNiveauFormationDiplomeSchema,
  bcnNMefSchema,
  bcnNDispositifFormationSchema,
  logSchema,
  userSchema,
  domainesMetiersSchema,
  ficheRncpSchema,
  codeIdccOpcoSchema,
  codeEnCodesIdccSchema,
};
