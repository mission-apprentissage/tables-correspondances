const { merge } = require("lodash");

module.exports = {
  apiEntrepriseMock: (etablissement = {}) => {
    return {
      getEtablissement: () => {
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
          etablissement
        );
      },
    };
  },
};
