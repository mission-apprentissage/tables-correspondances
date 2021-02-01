const { oleoduc, transformData, writeData } = require("oleoduc");
const { isEmpty } = require("lodash");
const csv = require("csv-parse");
const { Annuaire } = require("../../common/model");
const logger = require("../../common/logger");

module.exports = async (stream) => {
  let stats = {
    total: 0,
    inserted: 0,
    invalid: 0,
    ignored: 0,
    failed: 0,
  };

  await oleoduc(
    stream,
    csv({
      delimiter: ";",
      columns: true,
    }),
    transformData((data) => {
      return {
        uai: data.numero_uai,
        siret: data.numero_siren_siret_uai,
        nom: data.patronyme_uai,
      };
    }),
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
