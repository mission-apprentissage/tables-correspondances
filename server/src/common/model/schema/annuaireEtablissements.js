const annuaireEtablissementsSchema = {
  id_gestionnaire: {
    type: String,
    default: null,
    description: "Identifiant MNA de l'établissement gestionnaire",
  },
  uai_gestionnaire: {
    type: String,
    default: null,
    description: "Uai de l'établissement gestionnaire",
  },
  siret_gestionnaire: {
    type: String,
    default: null,
    description: "Siret de l'établissement gestionnaire",
  },
  libelle_administratif_gestionnaire: {
    type: String,
    default: null,
    description: "Libelle administratif gestionnaire",
  },
  id_formateur: {
    type: String,
    default: null,
    description: "Identifiant MNA de l'établissement formateur",
  },
  uai_formateur: {
    type: String,
    default: null,
    description: "Uai de l'établissement formateur",
  },
  siret_formateur: {
    type: String,
    default: null,
    description: "Siret de l'établissement formateur",
  },
  libelle_administratif_formateur: {
    type: String,
    default: null,
    description: "Libelle administratif formateur",
  },
  //   annee_scolaire: {
  //     type: String,
  //     default: null,
  //     description: "Annne",
  //   },
  forme_etablissement: {
    type: String,
    default: null,
    description: "Type d'établissement Regroupement, Support Pédagogique, Etablissement d'enseignement",
  },
  nature_etablissement: {
    type: String,
    default: null,
    description: "Nature de l'établissement College , Atelier",
  },
  libelle_administratif: {
    type: String,
    default: null,
    description: "Libelle administratif de l'établissement",
  },
  libelle_communication: {
    type: String,
    default: null,
    description: "Libelle commun de l'établissement",
  },
  debut_validite: {
    type: String,
    default: null,
    description: "Début de validité de l'établissement",
  },
  fin_validite: {
    type: String,
    default: null,
    description: "Fin de validité de l'établissement",
  },
  siteweb: {
    type: String,
    default: null,
    description: "URL site web",
  },
  telephone: {
    type: String,
    default: null,
    description: "Numéro de téléphone établissement",
  },
  email_communication: {
    type: String,
    default: null,
    description: "Email communication établissement",
  },
  fax: {
    type: String,
    default: null,
    description: "Numéro de fax établissement",
  },
  ministere: {
    type: String,
    default: null,
    description: "Ministere de tutuelle",
  },
  secteur: {
    type: String,
    default: null,
    description: "Secteur Public / Privé",
  },
  prive_orgaffiliation: {
    type: String,
    default: null,
    description: "Organisme affiliation",
  },
  prive_typecontrat: {
    type: String,
    default: null,
    description: "Type de contrat (Rythme alternance etc..)",
  },
  siret: {
    type: String,
    default: null,
    description: "Numéro de siret",
  },
  uai: {
    type: String,
    default: null,
    description: "Numéro d'UAI",
  },
  libelle_educnationale: {
    type: String,
    default: null,
    description: "Libelle éducation nationale",
  },
  eleve: {
    type: Boolean,
    default: false,
    description: "Accueil des éleves",
  },
  etudiant: {
    type: Boolean,
    default: false,
    description: "Accueil des étudiants",
  },
  adulte: {
    type: Boolean,
    default: false,
    description: "Accueil des adultes",
  },
  apprenti: {
    type: Boolean,
    default: false,
    description: "Accueil des apprentis",
  },
  code_insee_localite: {
    type: String,
    default: null,
    description: "Code Insee localité",
  },
  code_postal: {
    type: String,
    default: null,
    description: "Code postal",
  },
  code_departement: {
    type: String,
    default: null,
    description: "Numéro de département",
  },
  departement: {
    type: String,
    default: null,
    description: "Nom département",
  },
  localite: {
    type: String,
    default: null,
    description: "Localité",
  },
  code_region: {
    type: String,
    default: null,
    description: "Code région",
  },
  region: {
    type: String,
    default: null,
    description: "Nom de la région",
  },
  niveau_uai: {
    type: Number,
    default: 0,
    description: "Niveau de dépendance d'établissement",
  },
  geo_coordonnees: {
    type: String,
    implicit_type: "geo_point",
    description: "Latitude et longitude de l'établissement",
  },
  administratif_siret_siege_social: {
    type: String,
    default: null,
    description: "",
  },
  siren: {
    type: String,
    default: null,
    description: "Numéro siren de l'entreprise",
  },
  naf_code: {
    type: String,
    default: null,
    description: "Code NAF",
  },
  naf_libelle: {
    type: String,
    default: null,
    description: "Libellé du code NAT (ex: Enseignement secondaire technique ou professionnel)",
  },
  tranche_effectif_salarie: {
    type: Object,
    default: {},
    description: "Tranche salariale",
  },
  date_creation: {
    type: Date,
    default: null,
    description: "Date de création",
  },
  date_mise_a_jour: {
    type: Date,
    default: null,
    description: "Date de création",
  },
  enseigne: {
    type: String,
    default: null,
    description: "Enseigne",
  },
  adresse: {
    type: String,
    default: null,
    description: "Adresse de l'établissement",
  },
  api_entreprise_adresse: {
    type: String,
    default: null,
    description: "Api entreprise Adresse de l'établissement",
  },
  api_entreprise_numero_voie: {
    type: String,
    default: null,
    description: "Numéro de la voie",
  },
  api_entreprise_type_voie: {
    type: String,
    default: null,
    description: "Type de voie (ex: rue, avenue)",
  },
  api_entreprise_nom_voie: {
    type: String,
    default: null,
    description: "Nom de la voie",
  },
  api_entreprise_complement_adresse: {
    type: String,
    default: null,
    description: "Complément d'adresse de l'établissement",
  },
  ferme: {
    type: Boolean,
    default: false,
    description: "A cessé son activité",
  },
  date_fermeture: {
    type: Date,
    default: null,
    description: "Date de cessation d'activité",
  },
  code_academie: {
    type: Number,
    default: 0,
    description: "Numéro de l'académie",
  },
  academie: {
    type: String,
    default: null,
    description: "Nom de l'académie",
  },
  type_etablissement: {
    type: String,
    default: null,
    description: "",
  },
  declare_prefecture: {
    type: String,
    default: null,
    description: "Etablissement est déclaré en prefecture",
  },
  conventionne: {
    type: String,
    default: null,
    description: "Etablissement est conventionné ou pas",
  },
  datadock: {
    type: String,
    default: null,
    description: "Etablissement est connu de datadock",
  },
  parcoursup: {
    type: Boolean,
    default: false,
    description: "L'établissement doit être ajouter à ParcourSup",
  },
  affelnet: {
    type: Boolean,
    default: false,
    description: "La formation doit être ajouter à affelnet",
  },
  email_administratif: {
    type: String,
    default: null,
    description: "Email administratif établissement",
  },
  email_technique: {
    type: String,
    default: null,
    description: "Email service techinque établissement",
  },

  entreprise_procedure_collective: {
    type: Boolean,
    default: false,
    description: "Procédure collective",
  },
  entreprise_enseigne: {
    type: String,
    default: null,
    description: "Enseigne",
  },
  entreprise_raison_sociale: {
    type: String,
    default: null,
    description: "Raison sociale",
  },
  entreprise_nom_commercial: {
    type: String,
    default: null,
    description: "Nom commercial",
  },
  entreprise_date_creation: {
    type: Date,
    default: null,
    description: "Date de création",
  },
  entreprise_date_radiation: {
    type: String,
    default: null,
    description: "Date de radiation",
  },
  entreprise_naf_code: {
    type: String,
    default: null,
    description: "Code NAF",
  },
  entreprise_naf_libelle: {
    type: String,
    default: null,
    description: "Libellé du code NAT (ex: Enseignement secondaire technique ou professionnel)",
  },
  entreprise_date_fermeture: {
    type: Date,
    default: null,
    description: "Date de cessation d'activité",
  },
  entreprise_ferme: {
    type: Boolean,
    default: false,
    description: "A cessé son activité",
  },
  entreprise_siret_siege_social: {
    type: String,
    default: null,
    description: "Numéro siret du siége sociale",
  },
  entreprise_tranche_effectif_salarie: {
    type: Object,
    default: {},
    description: "Tranche salarié",
  },

  catalogue_published: {
    type: Boolean,
    default: false,
    description: "Est publié dans le catalogue général",
  },
  published: {
    type: Boolean,
    default: false,
    description: "Est publié",
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

module.exports = annuaireEtablissementsSchema;
