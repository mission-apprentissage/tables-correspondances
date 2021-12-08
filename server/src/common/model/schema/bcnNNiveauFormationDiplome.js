const bcnNNiveauFormationDiplomeSchema = {
  NIVEAU_FORMATION_DIPLOME: {
    index: true,
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  NIVEAU_INTERMINISTERIEL: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  LIBELLE_COURT: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  LIBELLE_100: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  ANCIEN_NIVEAU: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  DATE_OUVERTURE: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  DATE_FERMETURE: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  DATE_INTERVENTION: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  NUMERO_COMPTE: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  GESTION_DIFFUSION: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  ID: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  CREATED_AT: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  UPDATED_AT: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  N_COMMENTAIRE: {
    type: String,
    default: null,
    description: "DESCRIPTION",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date d'ajout en base de données",
  },
  last_update_at: {
    type: Date,
    default: Date.now,
    description: "Date de dernières mise à jour",
  },
};
module.exports = bcnNNiveauFormationDiplomeSchema;
