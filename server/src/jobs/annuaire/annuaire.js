const { oleoduc, transformData, writeData } = require("oleoduc");
const parsers = require("./parsers/parsers");
const { Annuaire } = require("../../common/model");
const logger = require("../../common/logger");

module.exports = {
  reset: async (deppStream) => {
    await Annuaire.deleteMany({});
    let stats = {
      total: 0,
      inserted: 0,
      failed: 0,
    };

    await oleoduc(
      deppStream,
      parsers["depp"](),
      transformData((e) => ({ ...e, uais: [{ type: "depp", uai: e.uai }] })),
      writeData(
        async (data) => {
          stats.total++;
          try {
            let count = await Annuaire.countDocuments({ siret: data.siret });
            if (count === 0) {
              let annuaire = new Annuaire(data);
              await annuaire.save();
              stats.inserted++;
            }
          } catch (e) {
            stats.failed++;
            logger.error(`Unable to insert document with siret ${data.siret} into annuaire`, e);
          }
        },
        { parallel: 25 }
      )
    );

    return stats;
  },
  addUAIs: async (type, stream, parser = parsers[type]()) => {
    let stats = {
      total: 0,
      updated: 0,
      failed: 0,
    };

    await oleoduc(
      stream,
      parser,
      writeData(
        async (current) => {
          try {
            stats.total++;

            if (!current.uai) {
              return;
            }

            let secondary = { type, uai: current.uai };
            let found = await Annuaire.findOne({
              siret: current.siret,
              uai: { $ne: current.uai },
              uais: { $nin: secondary },
            });

            if (found) {
              found.uais.push(secondary);
              await found.save();
              stats.updated++;
            }
          } catch (e) {
            stats.failed++;
            logger.error(`Unable to add UAI informations for siret ${current.siret}`, e);
          }
        },
        { parallel: 25 }
      )
    );

    return stats;
  },
};
