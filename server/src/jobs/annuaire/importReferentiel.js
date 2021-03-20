const { oleoduc, writeData } = require("oleoduc");
const { isEmpty } = require("lodash");
const { flattenObject } = require("../../common/utils/objectUtils");
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
    referentiel.stream(),
    writeData(async (data) => {
      stats.total++;
      if (isEmpty(data.siret)) {
        stats.failed++;
        logger.error(`[Referentiel] Siret invalide pour l'établissement ${JSON.stringify(data)}`);
        return;
      }

      try {
        let res = await Annuaire.updateOne(
          { siret: data.siret },
          {
            $set: {
              ...flattenObject(data),
              referentiel: referentiel.name,
            },
          },
          { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );

        stats.updated += res.nModified || 0;
        stats.created += (res.upserted && res.upserted.length) || 0;
      } catch (e) {
        stats.failed++;
        logger.error(`[Referentiel] Impossible d'ajouter le document avec le siret ${data.siret} dans l'annuaire`, e);
      }
    })
  );

  return stats;
};
