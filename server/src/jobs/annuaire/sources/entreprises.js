const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const logger = require("../../../common/logger");

const MAX_ALLOWED_SCORE = 0.6;

module.exports = async (apiEntreprise, apiGeoAddresse) => {
  const geocode = async ({ siret, adresse }) => {
    let query =
      `${adresse.numero_voie || ""} ${adresse.type_voie || ""} ${adresse.nom_voie}` +
      ` ${adresse.code_postal} ${adresse.localite}`.split(" ").join("+");

    try {
      let results = await apiGeoAddresse.search(query, {
        postcode: adresse.code_postal,
        citycode: adresse.code_insee_localite,
      });

      let best = results.features[0];
      let score = best.properties.score;
      if (score < MAX_ALLOWED_SCORE) {
        logger.warn(`Score de geocoding trop faible ${score} pour le siret ${siret} et l'adresse ${query}`);
      } else {
        return { position: best.geometry, description: best.properties.label };
      }
    } catch (e) {
      logger.warn(`Impossible de géocoder l'adresse : ${query} pour le siret ${siret}`, e);
    }
  };

  const getAdressePostale = (adresse) => {
    return Object.keys(adresse)
      .filter((k) => /l[0-9]/.test(k) && adresse[k])
      .map((k) => adresse[k])
      .join("\n");
  };

  return oleoduc(
    Annuaire.find().cursor(),
    transformData(async (etablissement) => {
      try {
        let entreprise = await apiEntreprise.getEtablissement(etablissement.siret);
        let adresse = entreprise.adresse;

        return {
          siret: etablissement.siret,
          data: {
            siegeSocial: entreprise.siege_social,
            statut: entreprise.etat_administratif.value === "A" ? "actif" : "fermé",
            adresse: {
              geocoding: await geocode(entreprise),
              postale: getAdressePostale(adresse),
              region: entreprise.region_implantation.code,
              numero_voie: adresse.numero_voie,
              type_voie: adresse.type_voie,
              nom_voie: adresse.numero_voie,
              code_postal: adresse.code_postal,
              code_insee: adresse.code_insee_localite,
              localite: adresse.localite,
              cedex: adresse.cedex,
            },
          },
        };
      } catch (e) {
        return { siret: etablissement, error: e };
      }
    }),
    { promisify: false }
  );
};
