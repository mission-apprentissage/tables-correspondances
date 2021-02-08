const { merge } = require("lodash");

module.exports = {
  createaApiGeoAddresseMock: (custom = {}) => {
    return {
      search: () => {
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
          custom
        );
      },
    };
  },
};
