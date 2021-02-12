const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const apiSirene = require("../../../common/apis/apiSirene");

function getRaisonSociale(e, uniteLegale) {
  return (
    e.denomination_usuelle ||
    uniteLegale.denomination ||
    uniteLegale.denomination_usuelle_1 ||
    uniteLegale.denomination_usuelle_2 ||
    uniteLegale.denomination_usuelle_3
  );
}

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
        if (!data) {
          return { siret, error: `Etablissement inconnu pour l'entreprise ${siren}` };
        }

        let siegeSocial = data.etablissement_siege === "true";
        let relations = await Promise.all(
          uniteLegale.etablissements
            .filter((e) => e.siret !== siret)
            .map(async (e) => {
              return {
                type: e.etablissement_siege === "true" ? "siege" : "établissement",
                annuaire: (await Annuaire.countDocuments({ siret: e.siret })) > 0,
                siret: e.siret,
                raisonSociale: getRaisonSociale(e, uniteLegale),
                statut: e.etat_administratif === "A" ? "actif" : "fermé",
                adresse: {
                  codePostal: e.code_postal,
                  localite: e.libelle_commune,
                },
              };
            })
        );

        return {
          siret,
          data: {
            relations,
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
              numeroVoie: data.numero_voie,
              typeVoie: data.type_voie,
              nomVoie: data.libelle_voie,
              codePostal: data.code_postal,
              codeInsee: data.code_commune,
              localite: data.libelle_commune,
              cedex: data.code_cedex,
            },
          },
        };
      } catch (e) {
        return { siret, error: e.reason === 404 ? "Entreprise inconnue" : e };
      }
    }),
    { promisify: false, parallel: 5 }
  );
};
