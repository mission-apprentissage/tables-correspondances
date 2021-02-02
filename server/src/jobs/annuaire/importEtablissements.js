const { oleoduc, writeData } = require("oleoduc");
const { isEmpty } = require("lodash");
const { Annuaire } = require("../../common/model");
const logger = require("../../common/logger");

module.exports = async (referentiel) => {
  let stats = {
    total: 0,
    inserted: 0,
    invalid: 0,
    ignored: 0,
    failed: 0,
  };

  await oleoduc(
    referentiel,
    writeData(async (e) => {
      stats.total++;
      if (isEmpty(e.siret)) {
        stats.invalid++;
        return;
      }

      try {
        let count = await Annuaire.countDocuments({ $or: [{ siret: e.siret }, { uai: e.uai }] });
        if (count === 0) {
          await Annuaire.create(e);
          stats.inserted++;
        } else {
          stats.ignored++;
        }
      } catch (e) {
        stats.failed++;
        logger.error(`Unable to insert document with siret ${e.siret} into annuaire`, e);
      }
    })
  );

  return stats;
};
