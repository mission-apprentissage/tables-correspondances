const { oleoduc, transformData, writeData } = require("oleoduc");
const { isEmpty } = require("lodash");
const { createSource } = require("./sources/sources");
const { Annuaire } = require("../../common/model");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

const createUaiElement = (type, uai) => {
  return { type, uai, valid: validateUAI(uai) };
};

module.exports = {
  deleteAll: () => Annuaire.deleteMany({}),
  initialize: async (stream) => {
    let stats = {
      total: 0,
      inserted: 0,
      invalid: 0,
      failed: 0,
    };

    await oleoduc(
      createSource("depp", { stream }),
      transformData((e) => ({ ...e, uais: [createUaiElement("depp", e.uai)] })),
      writeData(
        async (data) => {
          stats.total++;
          if (isEmpty(data.siret)) {
            stats.invalid++;
            return;
          }

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
  collect: async (type, source) => {
    let stats = {
      total: 0,
      updated: 0,
      failed: 0,
    };

    await oleoduc(
      source,
      writeData(
        async (current) => {
          try {
            stats.total++;

            if (!current.uai) {
              return;
            }

            let element = createUaiElement(type, current.uai);
            let found = await Annuaire.findOne({
              siret: current.siret,
              uai: { $ne: current.uai },
              "uais.uai": { $ne: current.uai },
            });

            if (found) {
              found.uais.push(element);
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
