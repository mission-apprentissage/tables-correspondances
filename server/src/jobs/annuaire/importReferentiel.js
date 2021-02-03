const { oleoduc, transformData, writeData } = require("oleoduc");
const { isEmpty } = require("lodash");
const { Annuaire } = require("../../common/model");
const logger = require("../../common/logger");

module.exports = async (referentiel, apiEntreprise, apiGeoAddresse) => {
  let type = referentiel.type;
  let stats = {
    total: 0,
    inserted: 0,
    ignored: 0,
    failed: 0,
  };

  const resolveAdresse = async ({ adresse, region_implantation }) => {
    let query = `${adresse.numero_voie}+${adresse.type_voie}+${adresse.nom_voie}+${adresse.code_postal}+${adresse.localite}`;
    let results = await apiGeoAddresse.search(query, {
      postcode: adresse.code_postal,
      citycode: adresse.code_insee_localite,
    });

    if (results.length === 0) {
      throw new Error(`Unable to find adresse ${query}`);
    }

    let best = results.features[0];
    return {
      position: best.geometry,
      label: best.properties.label,
      region: region_implantation.code,
      ...adresse,
    };
  };

  await oleoduc(
    referentiel,
    transformData(
      async (etablissement) => {
        if (isEmpty(etablissement.siret)) {
          return { err: new Error(`Siret invalide ${etablissement.siret}`) };
        }

        try {
          let entreprise = await apiEntreprise.getEtablissement(etablissement.siret);
          let adresse = await resolveAdresse(entreprise);

          return {
            etablissement: {
              ...etablissement,
              siegeSocial: entreprise.siege_social,
              statut: entreprise.etat_administratif.value === "A" ? "actif" : "fermé",
              adresse,
            },
          };
        } catch (err) {
          return { err };
        }
      },
      { parallel: 2 }
    ),
    writeData(async ({ err, etablissement }) => {
      stats.total++;
      if (err) {
        stats.failed++;
        logger.error(`[Referentiel] Erreur lors du traitement d'un établissement pour le référentiel ${type}`, err);
        return;
      }

      try {
        let count = await Annuaire.countDocuments({
          $or: [{ siret: etablissement.siret }, { uai: etablissement.uai }],
        });
        if (count === 0) {
          await Annuaire.create(etablissement);
          stats.inserted++;
        } else {
          stats.ignored++;
        }
      } catch (e) {
        stats.failed++;
        logger.error(`[Referentiel] Unable to insert document with siret ${e.siret} into annuaire`, e);
      }
    })
  );

  return stats;
};
