const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const apiSirene = require("../../../common/apis/apiSirene");

module.exports = async (options = {}) => {
  let api = options.apiSirene || apiSirene;

  return oleoduc(
    Annuaire.find().cursor(),
    transformData(async (etablissement) => {
      let siret = etablissement.siret;

      try {
        let siren = siret.substring(0, 9);
        let uniteLegale = await api.getUniteLegale(siren);
        let data = uniteLegale.etablissements.find((e) => e.siret === siret);
        let siegeSocial = data.etablissement_siege === "true";
        let filiations = await Promise.all(
          uniteLegale.etablissements
            .filter((e) => e.siret !== siret)
            .map(async (e) => {
              return {
                type: e.etablissement_siege === "true" ? "siege" : "établissement",
                siret: e.siret,
                statut: e.etat_administratif === "A" ? "actif" : "fermé",
                exists: (await Annuaire.countDocuments({ siret: e.siret })) > 0,
              };
            })
        );

        return {
          siret,
          data: {
            filiations,
            siegeSocial: siegeSocial,
            statut: data.etat_administratif === "A" ? "actif" : "fermé",
            adresse: {
              geojson: {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                },
                properties: {
                  score: parseFloat(data.geo_score),
                },
              },
              label: data.geo_adresse,
              numero_voie: data.numero_voie,
              type_voie: data.type_voie,
              nom_voie: data.libelle_voie,
              code_postal: data.code_postal,
              code_insee: data.code_commune,
              localite: data.libelle_commune,
              cedex: data.code_cedex,
            },
          },
        };
      } catch (e) {
        return { siret, error: e };
      }
    }),
    { promisify: false, parallel: 5 }
  );
};
