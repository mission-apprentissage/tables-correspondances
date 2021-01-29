const { oleoduc, transformData, writeData, csvStream, jsonStream } = require("oleoduc");
const { isEmpty, omit } = require("lodash");
const csv = require("csv-parse");
const { Annuaire } = require("../../common/model");
const { getNbModifiedDocuments } = require("../../common/utils/mongooseUtils");
const { validateUAI } = require("../../common/utils/uaiUtils");
const logger = require("../../common/logger");

module.exports = {
  deleteAll: () => Annuaire.deleteMany({}),
  initialize: async (stream) => {
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
  },
  collect: async (source) => {
    let stats = {
      total: 0,
      updated: 0,
      failed: 0,
    };

    await oleoduc(
      source,
      writeData(async (current) => {
        try {
          stats.total++;

          let found = await Annuaire.findOne({ siret: current.siret });
          if (!found) {
            return;
          }

          let already = found.uai === current.uai || !!found.uais_secondaires.find(({ uai }) => uai === current.uai);
          let res = await Annuaire.updateOne(
            { _id: found._id },
            {
              $set: {
                ...omit(current, ["uai", "siret", "nom"]),
              },
              ...(already
                ? {}
                : {
                    $push: {
                      uais_secondaires: { type: source.type, uai: current.uai, valide: validateUAI(current.uai) },
                    },
                  }),
            }
          );
          stats.updated += getNbModifiedDocuments(res);
        } catch (e) {
          stats.failed++;
          logger.error(`Unable to add UAI informations for siret ${current.siret}`, e);
        }
      })
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
