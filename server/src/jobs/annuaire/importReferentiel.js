const { oleoduc, transformData, writeData } = require("oleoduc");
const { isEmpty } = require("lodash");
const { Annuaire } = require("../../common/model");
const logger = require("../../common/logger");

module.exports = async (referentiel, apiEntreprise) => {
  let type = referentiel.type;
  let stats = {
    total: 0,
    inserted: 0,
    ignored: 0,
    failed: 0,
  };
  const fetchEntrepriseInformations = async (siret) => {
    let info = await apiEntreprise.getEtablissement(siret);
    return {
      siegeSocial: info.siege_social,
      dateCreation: new Date(info.date_creation_etablissement * 1000),
      statut: info.etat_administratif.value === "A" ? "actif" : "fermé",
      region: info.region_implantation.code,
    };
  };

  await oleoduc(
    referentiel,
    transformData(
      async (e) => {
        if (isEmpty(e.siret)) {
          return { err: new Error(`Siret invalide ${e.siret}`) };
        }

        try {
          let info = await fetchEntrepriseInformations(e.siret);
          return {
            etablissement: {
              ...e,
              ...info,
            },
          };
        } catch (e) {
          return {
            err: new Error(`Erreur API entreprise pour le siret ${e.siret}. ${e.message}`),
          };
        }
      },
      { parallel: 5 }
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
