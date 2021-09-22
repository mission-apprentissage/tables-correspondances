const logSchema = require("./log");
const bcnFormationDiplomesSchema = require("./bcnFormationDiplomes");
const userSchema = require("./user");
const domainesMetiersSchema = require("./domainesmetiers");
const ficheRncpSchema = require("./ficheRncp");

const bcnLettreSpecialiteSchema = require("./bcnLettreSpecialite");
const bcnNNiveauFormationDiplomeSchema = require("./bcnNNiveauFormationDiplome");
const bcnNMefSchema = require("./bcnNMef");
const bcnNDispositifFormationSchema = require("./bcnNDispositifFormation");
const etablissementSchema = require("./etablissement");
const conventionFileSchema = require("./conventionFile");
const onisepSchema = require("./onisep");

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
  etablissementSchema,
  conventionFileSchema,
  codeIdccOpcoSchema,
  codeEnCodesIdccSchema,
  onisepSchema,
};
