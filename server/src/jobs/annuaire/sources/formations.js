const { uniqBy } = require("lodash");
const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const apiCatalogue = require("../../../common/apis/apiCatalogue");

async function getFormations(api, siret, options = {}) {
  let res = api.getFormations(
    {
      $or: [{ etablissement_formateur_siret: siret }, { etablissement_gestionnaire_siret: siret }],
    },
    {
      select: {
        etablissement_gestionnaire_siret: 1,
        etablissement_gestionnaire_entreprise_raison_sociale: 1,
        etablissement_formateur_siret: 1,
        etablissement_formateur_entreprise_raison_sociale: 1,
      },
      resultats_par_page: 600, // no pagination needed for the moment
      ...options,
    }
  );
  return res.formations;
}

module.exports = async (custom = {}) => {
  let api = custom.apiCatalogue || apiCatalogue;

  return {
    stream(options = {}) {
      let filters = options.filters || {};

      return oleoduc(
        Annuaire.find(filters, { siret: 1 }).lean().cursor(),
        transformData(async ({ siret }) => {
          try {
            let [_2020, _2021] = await Promise.all([
              getFormations(api, siret),
              getFormations(api, siret, { annee: "2021" }),
            ]);

            let relations = await Promise.all(
              [..._2020, ..._2021]
                .filter((f) => f.etablissement_gestionnaire_siret !== f.etablissement_formateur_siret)
                .map(async (f) => {
                  let isFormateurType = siret === f.etablissement_gestionnaire_siret;
                  let relationSiret = isFormateurType
                    ? f.etablissement_formateur_siret
                    : f.etablissement_gestionnaire_siret;
                  let label = isFormateurType
                    ? f.etablissement_formateur_entreprise_raison_sociale
                    : f.etablissement_gestionnaire_entreprise_raison_sociale;

                  return {
                    siret: relationSiret,
                    label,
                    type: isFormateurType ? "formateur" : "gestionnaire",
                  };
                })
            );

            return {
              selector: siret,
              relations: uniqBy(relations, "siret"),
            };
          } catch (e) {
            return { selector: siret, anomalies: [e.reason === 404 ? "Entreprise inconnue" : e] };
          }
        }),
        { promisify: false, parallel: 5 }
      );
    },
  };
};
