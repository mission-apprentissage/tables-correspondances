const { oleoduc, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const apiCatalogue = require("../../../common/apis/apiCatalogue");

module.exports = async (options = {}) => {
  let api = options.apiCatalogue || apiCatalogue;
  let filters = options.filters || {};

  return oleoduc(
    Annuaire.find(filters).cursor(),
    transformData(async (etablissement) => {
      let siret = etablissement.siret;

      try {
        let { formations } = await api.getFormations(
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
            resultats_par_page: 1000, // no pagination needed
          }
        );

        let relations = await Promise.all(
          formations
            .filter((f) => f.etablissement_gestionnaire_siret !== f.etablissement_formateur_siret)
            .map(async (f) => {
              let isFormateurType = siret === f.etablissement_gestionnaire_siret;
              let relationSiret = isFormateurType
                ? f.etablissement_formateur_siret
                : f.etablissement_gestionnaire_siret;
              let found = await Annuaire.findOne({ siret: relationSiret });
              let label = isFormateurType
                ? f.etablissement_formateur_entreprise_raison_sociale
                : f.etablissement_gestionnaire_entreprise_raison_sociale;

              return {
                siret: relationSiret,
                annuaire: !!found,
                label: found ? found.raison_sociale : label,
                type: isFormateurType ? "formateur" : "gestionnaire",
              };
            })
        );

        return {
          siret,
          data: {
            relations: relations.reduce((acc, current) => {
              let already = etablissement.relations.find((r) => r.siret === current.siret);
              if (already) {
                already.type = current.type;
                acc.push(already);
              } else if (!acc.find((r) => r.siret === current.siret)) {
                acc.push(current);
              }
              return acc;
            }, []),
          },
        };
      } catch (e) {
        return { siret, anomalies: [e.reason === 404 ? "Entreprise inconnue" : e] };
      }
    }),
    { promisify: false, parallel: 5 }
  );
};