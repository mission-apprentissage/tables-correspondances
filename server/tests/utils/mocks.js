const { merge, mergeWith, isArray } = require("lodash");

const arrayMerger = (strategy) => (...args) => {
  return mergeWith(...args, function (a, b) {
    if (isArray(a)) {
      switch (strategy) {
        case "merge":
          return merge(a, b);
        default:
          return b.concat(a);
      }
    }
  });
};

module.exports = {
  createApiGeoAddresseMock: (custom = {}) => {
    return {
      search() {
        return merge(
          {},
          {
            type: "FeatureCollection",
            version: "draft",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [2.396444, 48.879706],
                },
                properties: {
                  label: "31 Rue des Lilas 75019 Paris",
                  score: 0.7490827272727273,
                  housenumber: "31",
                  id: "75119_5683_00031",
                  name: "31 Rue des Lilas",
                  postcode: "75019",
                  citycode: "75119",
                  x: 655734.91,
                  y: 6864578.76,
                  city: "Paris",
                  district: "Paris 19e Arrondissement",
                  context: "75, Paris, Île-de-France",
                  type: "housenumber",
                  importance: 0.73991,
                  street: "Rue des Lilas",
                },
              },
            ],
            attribution: "BAN",
            licence: "ETALAB-2.0",
            query: '31 rue des lilas 75001 Paris"',
            limit: 5,
          },
          custom
        );
      },
    };
  },
  createApiEntrepriseMock: (custom = {}) => {
    return {
      getEtablissement() {
        return merge(
          {},
          {
            siege_social: true,
            siret: "11111111111111",
            naf: "6202A",
            libelle_naf: "Conseil en systèmes et logiciels informatiques",
            date_mise_a_jour: 1608114766,
            tranche_effectif_salarie_etablissement: {
              de: null,
              a: null,
              code: null,
              date_reference: null,
              intitule: null,
            },
            date_creation_etablissement: 1606431600,
            region_implantation: {
              code: "11",
              value: "Île-de-France",
            },
            commune_implantation: {
              code: "75000",
              value: "Paris",
            },
            pays_implantation: {
              code: "FR",
              value: "FRANCE",
            },
            diffusable_commercialement: true,
            enseigne: null,
            adresse: {
              l1: "NOMAYO",
              l2: null,
              l3: null,
              l4: "31 RUE DES LILAS",
              l5: null,
              l6: "75001 PARIS",
              l7: "FRANCE",
              numero_voie: "31",
              type_voie: "RUE",
              nom_voie: "DES LILAS",
              complement_adresse: null,
              code_postal: "75001",
              localite: "PARIS",
              code_insee_localite: "75000",
              cedex: null,
            },
            etat_administratif: {
              value: "A",
              date_fermeture: null,
            },
          },
          custom
        );
      },
    };
  },
  createApiEsSup: (custom = {}) => {
    return {
      async fetchInfoFromCodeCommune() {
        return merge(
          {},
          {
            nhits: 1,
            parameters: {
              dataset: "fr-esr-referentiel-geographique",
              refine: {
                com_code: "75001",
              },
              timezone: "UTC",
              rows: 1,
              start: 0,
              format: "json",
            },
            records: [
              {
                datasetid: "fr-esr-referentiel-geographique",
                recordid: "68784c1099e186e3aa8a3ed72d84d350e4d97bea",
                fields: {
                  com_code2: "75001",
                  reg_id_old: "R11",
                  com_code1: "75001",
                  au_code: "SO",
                  uucr_id: "SO",
                  aca_nom: "Paris",
                  com_nom_maj_court: "ALFORTVILLE",
                  uu_id_99: "SO",
                  regrgp_nom: "Île-de-France",
                  dep_code: "75",
                  au_id: "SO",
                  uu_id_10: "SO",
                  com_code: "75001",
                  aca_code: "01",
                  reg_code_old: "11",
                  dep_nom: "Paris",
                  aca_id: "A01",
                  com_nom_maj: "ALFORTVILLE",
                  com_nom: "Alfortville",
                  fr_id: "FR11",
                  reg_nom_old: "Île-de-France",
                  auc_nom: "SO",
                  com_id: "C75001",
                  fe_id: "FE1",
                  ze_id: "SO",
                  uucr_nom: "Alfortville",
                  fd_id: "FD111",
                  reg_code: "11",
                  dep_nom_num: "Paris (75)",
                  dep_num_nom: "75 - Paris",
                  reg_nom: "Île-de-France",
                  reg_id: "R11",
                  auc_id: "SO",
                  dep_id: "D075",
                  uu_id: "SO",
                },
                record_timestamp: "2020-11-23T13:58:15.677000+00:00",
              },
            ],
            facet_groups: [
              {
                facets: [
                  {
                    count: 1,
                    path: "75001",
                    state: "refined",
                    name: "75001",
                  },
                ],
                name: "com_code",
              },
            ],
          },
          custom
        );
      },
    };
  },
  createApiSireneMock: (custom = {}, options = {}) => {
    let mergeMockedData = options.array ? arrayMerger(options.array) : merge;
    return {
      getUniteLegale() {
        return mergeMockedData(
          {},
          {
            id: 129568762,
            siren: "111111111",
            statut_diffusion: "O",
            unite_purgee: null,
            date_creation: "2015-11-01",
            sigle: null,
            sexe: null,
            prenom_1: null,
            prenom_2: null,
            prenom_3: null,
            prenom_4: null,
            prenom_usuel: null,
            pseudonyme: null,
            identifiant_association: null,
            tranche_effectifs: "01",
            annee_effectifs: "2018",
            date_dernier_traitement: "2020-12-16T11:32:46",
            nombre_periodes: "3",
            categorie_entreprise: "PME",
            annee_categorie_entreprise: "2018",
            date_fin: null,
            date_debut: "2020-11-27",
            etat_administratif: "A",
            nom: null,
            nom_usage: null,
            denomination: "NOMAYO",
            denomination_usuelle_1: null,
            denomination_usuelle_2: null,
            denomination_usuelle_3: null,
            categorie_juridique: "5710",
            activite_principale: "62.02A",
            nomenclature_activite_principale: "NAFRev2",
            nic_siege: "11111",
            economie_sociale_solidaire: "N",
            caractere_employeur: "O",
            created_at: "2021-02-02T02:54:53.578+01:00",
            updated_at: "2021-02-02T02:54:53.578+01:00",
            etablissement_siege: {
              id: 276827433,
              siren: "111111111",
              nic: "11111",
              siret: "11111111111111",
              statut_diffusion: "O",
              date_creation: "2020-11-27",
              tranche_effectifs: null,
              annee_effectifs: null,
              activite_principale_registre_metiers: null,
              date_dernier_traitement: "2020-12-16T11:32:46",
              etablissement_siege: "true",
              nombre_periodes: "1",
              complement_adresse: null,
              numero_voie: "31",
              indice_repetition: "B",
              type_voie: "RUE",
              libelle_voie: "DES LILAS",
              code_postal: "75019",
              libelle_commune: "PARIS",
              libelle_commune_etranger: null,
              distribution_speciale: null,
              code_commune: "75000",
              code_cedex: null,
              libelle_cedex: null,
              code_pays_etranger: null,
              libelle_pays_etranger: null,
              complement_adresse_2: null,
              numero_voie_2: null,
              indice_repetition_2: null,
              type_voie_2: null,
              libelle_voie_2: null,
              code_postal_2: null,
              libelle_commune_2: null,
              libelle_commune_etranger_2: null,
              distribution_speciale_2: null,
              code_commune_2: null,
              code_cedex_2: null,
              libelle_cedex_2: null,
              code_pays_etranger_2: null,
              libelle_pays_etranger_2: null,
              date_debut: "2020-11-27",
              etat_administratif: "A",
              enseigne_1: null,
              enseigne_2: null,
              enseigne_3: null,
              denomination_usuelle: null,
              activite_principale: "62.02A",
              nomenclature_activite_principale: "NAFRev2",
              caractere_employeur: "O",
              longitude: "2.396147",
              latitude: "48.880391",
              geo_score: "0.88",
              geo_type: "housenumber",
              geo_adresse: "31 rue des lilas Paris 75019",
              geo_id: "75019_1475_00031_bis",
              geo_ligne: "G",
              geo_l4: "31 RUE DES LILAS",
              geo_l5: null,
              unite_legale_id: 129568762,
              created_at: "2021-02-02T17:46:40.046+01:00",
              updated_at: "2021-02-02T17:46:40.046+01:00",
            },
            numero_tva_intra: "FR74814562112",
            etablissements: [
              {
                id: 276827433,
                siren: "111111111",
                nic: "11111",
                siret: "11111111111111",
                statut_diffusion: "O",
                date_creation: "2020-11-27",
                tranche_effectifs: null,
                annee_effectifs: null,
                activite_principale_registre_metiers: null,
                date_dernier_traitement: "2020-12-16T11:32:46",
                etablissement_siege: "true",
                nombre_periodes: "1",
                complement_adresse: null,
                numero_voie: "31",
                indice_repetition: "B",
                type_voie: "RUE",
                libelle_voie: "DES LILAS",
                code_postal: "75001",
                libelle_commune: "PARIS",
                libelle_commune_etranger: null,
                distribution_speciale: null,
                code_commune: "75000",
                code_cedex: null,
                libelle_cedex: null,
                code_pays_etranger: null,
                libelle_pays_etranger: null,
                complement_adresse_2: null,
                numero_voie_2: null,
                indice_repetition_2: null,
                type_voie_2: null,
                libelle_voie_2: null,
                code_postal_2: null,
                libelle_commune_2: null,
                libelle_commune_etranger_2: null,
                distribution_speciale_2: null,
                code_commune_2: null,
                code_cedex_2: null,
                libelle_cedex_2: null,
                code_pays_etranger_2: null,
                libelle_pays_etranger_2: null,
                date_debut: "2020-11-27",
                etat_administratif: "A",
                enseigne_1: null,
                enseigne_2: null,
                enseigne_3: null,
                denomination_usuelle: null,
                activite_principale: "62.02A",
                nomenclature_activite_principale: "NAFRev2",
                caractere_employeur: "O",
                longitude: "2.396147",
                latitude: "48.880391",
                geo_score: "0.88",
                geo_type: "housenumber",
                geo_adresse: "31 rue des lilas Paris 75001",
                geo_id: "75001_1475_00031_bis",
                geo_ligne: "G",
                geo_l4: "31 RUE DES LILAS",
                geo_l5: null,
                unite_legale_id: 129568762,
                created_at: "2021-02-02T17:46:40.046+01:00",
                updated_at: "2021-02-02T17:46:40.046+01:00",
              },
            ],
          },
          custom
        );
      },
      getEtablissement() {
        return mergeMockedData(
          {},
          {
            id: 276827433,
            siren: "111111111",
            nic: "11111",
            siret: "11111111111111",
            statut_diffusion: "O",
            date_creation: "2020-11-27",
            tranche_effectifs: null,
            annee_effectifs: null,
            activite_principale_registre_metiers: null,
            date_dernier_traitement: "2020-12-16T11:32:46",
            etablissement_siege: "true",
            nombre_periodes: "1",
            complement_adresse: null,
            numero_voie: "31",
            indice_repetition: "B",
            type_voie: "RUE",
            libelle_voie: "DES LILAS",
            code_postal: "75019",
            libelle_commune: "PARIS",
            libelle_commune_etranger: null,
            distribution_speciale: null,
            code_commune: "75000",
            code_cedex: null,
            libelle_cedex: null,
            code_pays_etranger: null,
            libelle_pays_etranger: null,
            complement_adresse_2: null,
            numero_voie_2: null,
            indice_repetition_2: null,
            type_voie_2: null,
            libelle_voie_2: null,
            code_postal_2: null,
            libelle_commune_2: null,
            libelle_commune_etranger_2: null,
            distribution_speciale_2: null,
            code_commune_2: null,
            code_cedex_2: null,
            libelle_cedex_2: null,
            code_pays_etranger_2: null,
            libelle_pays_etranger_2: null,
            date_debut: "2020-11-27",
            etat_administratif: "A",
            enseigne_1: null,
            enseigne_2: null,
            enseigne_3: null,
            denomination_usuelle: null,
            activite_principale: "62.02A",
            nomenclature_activite_principale: "NAFRev2",
            caractere_employeur: "O",
            longitude: "2.396147",
            latitude: "48.880391",
            geo_score: "0.88",
            geo_type: "housenumber",
            geo_adresse: "31 rue des lilas Paris 75019",
            geo_id: "75019_1475_00031_bis",
            geo_ligne: "G",
            geo_l4: "31 RUE DES LILAS",
            geo_l5: null,
            unite_legale_id: 129568762,
            created_at: "2021-02-02T17:46:40.046+01:00",
            updated_at: "2021-02-02T17:46:40.046+01:00",
          },
          custom
        );
      },
    };
  },
  createApiCatalogueMock: (custom = {}, options = {}) => {
    let mergeMockedData = options.array ? arrayMerger(options.array) : merge;
    return {
      getFormations() {
        return mergeMockedData(
          {},
          {
            formations: [
              {
                _id: "5fc6166c712d48a9881333ac",
                etablissement_gestionnaire_id: "5e8df8a420ff3b2161267c58",
                etablissement_gestionnaire_siret: "11111111111111",
                etablissement_gestionnaire_enseigne: null,
                etablissement_gestionnaire_uai: "1111111X",
                etablissement_gestionnaire_type: "CFA",
                etablissement_gestionnaire_conventionne: "OUI",
                etablissement_gestionnaire_declare_prefecture: "OUI",
                etablissement_gestionnaire_datadock: "datadocké",
                etablissement_gestionnaire_published: true,
                etablissement_gestionnaire_catalogue_published: true,
                etablissement_gestionnaire_adresse: "31 rue des lilas",
                etablissement_gestionnaire_code_postal: "75019",
                etablissement_gestionnaire_code_commune_insee: "75000",
                etablissement_gestionnaire_localite: "Paris",
                etablissement_gestionnaire_complement_adresse: "LYCEE",
                etablissement_gestionnaire_cedex: null,
                etablissement_gestionnaire_entreprise_raison_sociale: "Centre de formation",
                rncp_etablissement_gestionnaire_habilite: false,
                etablissement_gestionnaire_region: "Paris",
                etablissement_gestionnaire_num_departement: "75",
                etablissement_gestionnaire_nom_departement: "Paris",
                etablissement_gestionnaire_nom_academie: "Paris",
                etablissement_gestionnaire_num_academie: "01",
                etablissement_gestionnaire_siren: "483986063",
                etablissement_formateur_id: "5e8df8a420ff3b2161267c58",
                etablissement_formateur_siret: "22222222222222",
                etablissement_formateur_enseigne: null,
                etablissement_formateur_uai: "1111111X",
                etablissement_formateur_type: "CFA",
                etablissement_formateur_conventionne: "OUI",
                etablissement_formateur_declare_prefecture: "OUI",
                etablissement_formateur_datadock: "datadocké",
                etablissement_formateur_published: true,
                etablissement_formateur_catalogue_published: true,
                etablissement_formateur_adresse: "31 rue des lilas",
                etablissement_formateur_code_postal: "75019",
                etablissement_formateur_code_commune_insee: "75000",
                etablissement_formateur_localite: "paris",
                etablissement_formateur_complement_adresse: "LYCEE",
                etablissement_formateur_cedex: null,
                etablissement_formateur_entreprise_raison_sociale: "Centre de formation",
                rncp_etablissement_formateur_habilite: false,
                etablissement_formateur_region: "Paris",
                etablissement_formateur_num_departement: "75",
                etablissement_formateur_nom_departement: "Paris",
                etablissement_formateur_nom_academie: "Paris",
                etablissement_formateur_num_academie: "01",
                etablissement_formateur_siren: "111111111",
                etablissement_reference: "gestionnaire",
                etablissement_reference_type: "CFA",
                etablissement_reference_conventionne: "OUI",
                etablissement_reference_declare_prefecture: "OUI",
                etablissement_reference_datadock: "datadocké",
                etablissement_reference_published: true,
                etablissement_reference_catalogue_published: true,
                cfd: "40030001",
                cfd_specialite: null,
                mef_10_code: null,
                nom_academie: "Paris",
                num_academie: "01",
                code_postal: "75019",
                code_commune_insee: "75000",
                num_departement: "75",
                nom_departement: "Paris",
                region: "Paris",
                localite: "Paris",
                uai_formation: null,
                nom: null,
                intitule_long: "GESTION-ADMINISTRATION (BAC PRO)",
                intitule_court: "GESTION-ADMINISTRATION",
                diplome: "BAC PROFESSIONNEL",
                niveau: "4 (Bac...)",
                onisep_url: "http://www.onisep.fr/http/redirection/formation/identifiant/28226",
                rncp_code: "RNCP34606",
                rncp_intitule: "Assistance gestion des organisations et de leurs activités",
                rncp_eligible_apprentissage: true,
                rncp_details: {
                  date_fin_validite_enregistrement: "8/31/25",
                  active_inactive: "ACTIVE",
                  etat_fiche_rncp: "Publiée",
                  niveau_europe: "niveau4",
                  code_type_certif: "BAC PRO",
                  type_certif: "Baccalauréat professionnel",
                  ancienne_fiche: ["RNCP14695"],
                  nouvelle_fiche: [],
                  demande: 0,
                  certificateurs: [],
                  nsf_code: "324",
                  nsf_libelle: "Secrétariat, bureautique",
                  romes: [
                    {
                      etat_fiche: "",
                      rome: "D1401",
                      libelle: "Assistanat commercial",
                    },
                    {
                      etat_fiche: "",
                      rome: "M1501",
                      libelle: "Assistanat en ressources humaines",
                    },
                    {
                      etat_fiche: "",
                      rome: "M1607",
                      libelle: "Secrétariat",
                    },
                    {
                      etat_fiche: "",
                      rome: "M1203",
                      libelle: "Comptabilité",
                    },
                  ],
                  blocs_competences: [
                    {
                      numero_bloc: "RNCP34606BC01",
                      intitule: "Organiser et suivre l'activité de production (de biens ou de services)",
                    },
                    {
                      numero_bloc: "RNCP34606BC02",
                      intitule: "Gérer des relations avec les clients, les usagers et les adhérents",
                    },
                    {
                      numero_bloc: "RNCP34606BC03",
                      intitule: "Administrer le personnel",
                    },
                    {
                      numero_bloc: "RNCP34606BC04",
                      intitule: "Prévention-santé-environnement",
                    },
                    {
                      numero_bloc: "RNCP34606BC05",
                      intitule: "Économie-droit",
                    },
                    {
                      numero_bloc: "RNCP34606BC06",
                      intitule: "Mathématiques",
                    },
                    {
                      numero_bloc: "RNCP34606BC07",
                      intitule: "Langues vivantes 1",
                    },
                    {
                      numero_bloc: "RNCP34606BC08",
                      intitule: "Langues vivantes 2",
                    },
                    {
                      numero_bloc: "RNCP34606BC09",
                      intitule: "Français",
                    },
                    {
                      numero_bloc: "RNCP34606BC10",
                      intitule: "Histoire-géographie et éducation civique",
                    },
                    {
                      numero_bloc: "RNCP34606BC11",
                      intitule: "Arts appliqués et cultures artistiques",
                    },
                    {
                      numero_bloc: "RNCP34606BC12",
                      intitule: "Éducation physique et sportive",
                    },
                    {
                      numero_bloc: "RNCP34606BC13",
                      intitule: "Langues vivantes (bloc facultatif)",
                    },
                    {
                      numero_bloc: "RNCP34606BC14",
                      intitule: "Mobilité (bloc facultatif)",
                    },
                    {
                      numero_bloc: "RNCP34606BC15",
                      intitule: "Éducation physique et sportive (bloc facultatif)",
                    },
                  ],
                  voix_acces: [
                    {
                      code_libelle: "CANDIDATURE",
                      intitule: "Par candidature individuelle",
                    },
                    {
                      code_libelle: "CONTRATA",
                      intitule: "En contrat d'apprentissage",
                    },
                    {
                      code_libelle: "CONTRATP",
                      intitule: "En contrat de professionnalisation",
                    },
                    {
                      code_libelle: "ELEVE",
                      intitule: "Après un parcours de formation sous statut d'élève ou d'étudiant",
                    },
                    {
                      code_libelle: "EXP",
                      intitule: "Par expérience",
                    },
                    {
                      code_libelle: "PFC",
                      intitule: "Après un parcours de formation continue",
                    },
                  ],
                },
                rome_codes: ["D1401", "M1501", "M1607", "M1203"],
                periode: '["2020-09", "2021-09"]',
                capacite: null,
                duree: null,
                annee: null,
                email: "contant@email.fr",
                parcoursup_reference: false,
                parcoursup_a_charger: true,
                affelnet_reference: false,
                affelnet_a_charger: false,
                source: "WS RCO",
                commentaires: null,
                opcos: [
                  "OPCO Commerce",
                  "OPCO Mobilité",
                  "OPCO Cohésion sociale",
                  "OCAPIAT",
                  "OPCO entreprises et salariés des services à forte intensité de main-d'œuvre",
                  "OPCO 2i",
                  "OPCO entreprises de proximité",
                ],
                info_opcos: 1,
                info_opcos_intitule: "Trouvés",
                published: false,
                draft: false,
                last_update_who: null,
                to_verified: false,
                update_error: null,
                lieu_formation_adresse: "31 rue des lilas",
                lieu_formation_siret: null,
                id_rco_formation: "01_GE107880|01_GE339324|01_GE520062|76930",
                lieu_formation_geo_coordonnees: "48.879706,2.396444",
                geo_coordonnees_etablissement_gestionnaire: "48.879706,2.396444",
                geo_coordonnees_etablissement_formateur: "48.879706,2.396444",
                idea_geo_coordonnees_etablissement: "48.879706,2.396444",
                created_at: "2020-12-01T10:09:48.309Z",
                last_update_at: "2021-01-21T08:24:21.784Z",
                parcoursup_statut: "hors périmètre",
                affelnet_statut: "hors périmètre",
                tags: ["2020", "2021"],
                affelnet_error: null,
                parcoursup_error: null,
                id: "5fc6166c712d48a9881333ac",
              },
            ],
            pagination: {
              page: 1,
              resultats_par_page: 10,
              nombre_de_page: 1,
              total: 1,
            },
          },
          custom
        );
      },
    };
  },
};
