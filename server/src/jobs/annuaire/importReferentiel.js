const { oleoduc, writeData } = require("oleoduc");
const { isEmpty } = require("lodash");
const { Annuaire } = require("../../common/model");
const logger = require("../../common/logger");

module.exports = async (referentiel) => {
  let stats = {
    total: 0,
    created: 0,
    updated: 0,
    failed: 0,
  };

  await oleoduc(
    await referentiel.stream(),
    writeData(async ({ from, siret }) => {
      stats.total++;
      if (isEmpty(siret)) {
        stats.failed++;
        logger.warn(`[Referentiel] Siret invalide pour l'établissement ${siret}`);
        return;
      }

      try {
        let res = await Annuaire.updateOne(
          { siret },
          {
            $set: {
              siret,
            },
            $addToSet: {
              referentiels: from || referentiel.name,
            },
          },
          { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );

        let created = res.upserted && res.upserted.length;
        let modified = res.nModified;
        if (created) {
          logger.debug(`[Annuaire][Referentiel] Etablissement ${siret} created`);
          stats.created += created || 0;
        } else if (modified) {
          stats.updated += modified || 0;
          logger.debug(`[Annuaire][Referentiel] Etablissement ${siret} updated`);
        }
      } catch (e) {
        stats.failed++;
        logger.error(`[Referentiel] Impossible d'ajouter le document avec le siret ${siret} dans l'annuaire`, e);
      }
    })
  );

  return stats;
};
