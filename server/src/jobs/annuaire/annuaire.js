const { oleoduc, transformData, filterData, writeData, csvStream, jsonStream } = require("oleoduc");
const { isEmpty } = require("lodash");
const { createSource } = require("./sources/sources");
const { Annuaire, Etablissement } = require("../../common/model");
const { validateUAI } = require("../../common/utils/uaiUtils");
const { getEtablissementStatut } = require("../../logic/controllers/entrepriseController");
const logger = require("../../common/logger");

module.exports = {
  deleteAll: () => Annuaire.deleteMany({}),
  initialize: async (stream, apiEntreprise) => {
    let source = await createSource("depp", stream);
    let stats = {
      total: 0,
      inserted: 0,
      invalid: 0,
      ignored: 0,
      failed: 0,
    };

    let duplicated = [];
    await oleoduc(
      source,
      filterData(({ uai, siret }) => {
        let already = duplicated.filter((d) => d === uai || d === siret).length > 0;
        duplicated.push(uai);
        duplicated.push(siret);
        if (already) {
          stats.ignored++;
        }
        return !already;
      }),
      transformData(
        async (e) => {
          try {
            let etablissement = await apiEntreprise.getEtablissement(e.siret);
            return {
              ...e,
              sirene: {
                siegeSocial: etablissement.siege_social,
                dateCreation: new Date(etablissement.date_creation_etablissement * 1000),
                statut: etablissement.etat_administratif.value === "A" ? "actif" : "fermé",
              },
            };
          } catch (e) {
            logger.error(`Unable to find etablissement ${e.siret} into api entreprise`);
            return e;
          }
        },
        { parallel: 10 }
      ),
      writeData(
        async (e) => {
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
            }
          } catch (e) {
            stats.failed++;
            logger.error(`Unable to insert document with siret ${e.siret} into annuaire`, e);
          }
        },
        { parallel: 10 }
      )
    );

    return stats;
  },
  collect: async (type, stream) => {
    let stats = {
      total: 0,
      updated: 0,
      failed: 0,
    };

    let source = await createSource(type, stream);

    await oleoduc(
      source,
      writeData(async (current) => {
        try {
          stats.total++;

          if (!current.uai) {
            return;
          }

          let found = await Annuaire.findOne({
            siret: current.siret,
            uai: { $ne: current.uai },
            "uais_secondaires.uai": { $ne: current.uai },
          });

          if (found) {
            found.uais_secondaires.push({ type, uai: current.uai, valide: validateUAI(current.uai) });
            await found.save();
            stats.updated++;
          }
        } catch (e) {
          stats.failed++;
          logger.error(`Unable to add UAI informations for siret ${current.siret}`, e);
        }
      })
    );

    return stats;
  },
  exportManquants: async (out, options = {}) => {
    return oleoduc(
      Annuaire.find().cursor(),
      transformData(
        async ({ siret, nom, uai }) => {
          try {
            let found = await Etablissement.findOne({ siret });
            if (found) {
              return null;
            }

            let { status } = await getEtablissementStatut(siret);
            return status === "actif" ? { siret, nom, uai } : null;
          } catch (e) {
            logger.error(`Unable to handle siret ${siret}`, e.message);
          }
        },
        { parallel: 10 }
      ),
      options.json ? jsonStream() : csvStream(),
      out
    );
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
