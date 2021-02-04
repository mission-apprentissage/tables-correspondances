const { oleoduc, transformData, writeData } = require("oleoduc");
const { isEmpty } = require("lodash");
const { Annuaire } = require("../../common/model");
const logger = require("../../common/logger");

const MAX_ALLOWED_SCORE = 0.6;

module.exports = async (referentiel, apiEntreprise, apiGeoAddresse) => {
  let type = referentiel.type;
  let stats = {
    total: 0,
    created: 0,
    updated: 0,
    failed: 0,
  };

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

  const buildEtablissement = async (data) => {
    let entreprise = await apiEntreprise.getEtablissement(data.siret);
    let adresse = entreprise.adresse;

    return {
      ...data,
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
    };
  };

  await oleoduc(
    referentiel,
    transformData(async (data) => {
      if (isEmpty(data.siret)) {
        return new Error(`Siret invalide ${data.siret}`);
      }

      try {
        return await buildEtablissement(data);
      } catch (err) {
        return err;
      }
    }),
    writeData(async (res) => {
      stats.total++;
      if (res instanceof Error) {
        stats.failed++;
        logger.error(`[Referentiel] Erreur lors de l'import d'un établissement pour le référentiel ${type}.`, res);
        return;
      }

      let etablissement = res;
      try {
        let res = await Annuaire.updateOne(
          { siret: etablissement.siret },
          {
            $set: {
              ...etablissement,
            },
          },
          { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );
        stats.updated += res.nModified || 0;
        stats.created += (res.upserted && res.upserted.length) || 0;
      } catch (e) {
        stats.failed++;
        logger.error(
          `[Referentiel] Impossible d'ajouter le document avec le siret ${etablissement.siret} dans l'annuaire`,
          e
        );
      }
    })
  );

  return stats;
};
