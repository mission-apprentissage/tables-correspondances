const logSchema = require("./log");
const bcnFormationDiplomesSchema = require("./bcnFormationDiplomes");
const userSchema = require("./user");
const ficheRncpSchema = require("./ficheRncp");

const bcnLettreSpecialiteSchema = require("./bcnLettreSpecialite");
const bcnNNiveauFormationDiplomeSchema = require("./bcnNNiveauFormationDiplome");
const bcnNMefSchema = require("./bcnNMef");
const bcnNDispositifFormationSchema = require("./bcnNDispositifFormation");
const conventionFileSchema = require("./conventionFile");
const onisepSchema = require("./onisep");

module.exports = {
  bcnFormationDiplomesSchema,
  bcnLettreSpecialiteSchema,
  bcnNNiveauFormationDiplomeSchema,
  bcnNMefSchema,
  bcnNDispositifFormationSchema,
  logSchema,
  userSchema,
  ficheRncpSchema,
  conventionFileSchema,
  onisepSchema,
};
