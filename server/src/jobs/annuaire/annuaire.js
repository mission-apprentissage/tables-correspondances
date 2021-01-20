const { oleoduc, transformData, writeData, csvStream, jsonStream } = require("oleoduc");
const { isEmpty } = require("lodash");
const { createSource } = require("./sources/sources");
const { Annuaire } = require("../../common/model");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

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
      transformData((e) => ({ ...e })),
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

            let element = { type, uai: current.uai, valide: validateUAI(current.uai) };
            let found = await Annuaire.findOne({
              siret: current.siret,
              uai: { $ne: current.uai },
              "uais_secondaires.uai": { $ne: current.uai },
            });

            if (found) {
              found.uais_secondaires.push(element);
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
  export: (out, options = {}) => {
    let formatter = options.json
      ? jsonStream()
      : csvStream({
          columns: {
            uai: (a) => a.uai,
            siret: (a) => a.siret,
            nom: (a) => a.nom,
            "UAIs secondaires disponibles": (a) => (a.uais_secondaires.length > 0 ? "Oui" : "Non"),
            "UAI secondaires": (a) =>
              a.uais_secondaires
                .map(({ uai, type }) => {
                  return `${uai}_${type}`;
                })
                .join("|"),
          },
        });

    return oleoduc(Annuaire.find().cursor(), formatter, out);
  },
};
