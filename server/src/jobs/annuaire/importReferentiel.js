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
    writeData(async ({ siret }) => {
      stats.total++;
      if (isEmpty(siret)) {
        stats.failed++;
        logger.error(`[Referentiel] Siret invalide pour l'établissement ${siret}`);
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
              referentiels: referentiel.name,
            },
          },
          { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );

        stats.updated += res.nModified || 0;
        stats.created += (res.upserted && res.upserted.length) || 0;
      } catch (e) {
        stats.failed++;
        logger.error(`[Referentiel] Impossible d'ajouter le document avec le siret ${siret} dans l'annuaire`, e);
      }
    })
  );

  return stats;
};
