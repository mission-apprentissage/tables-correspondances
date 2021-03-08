const { oleoduc, transformData, flattenArray, filterData } = require("oleoduc");
const csv = require("csv-parse");
const { decodeStream } = require("iconv-lite");
const { Annuaire } = require("../../../common/model");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (options = {}) => {
  let filters = options.filters || {};
  let stream = options.input || (await getOvhFileAsStream("annuaire/ONISEP-Ideo2-T_Export_complet.csv"));

  return oleoduc(
    stream,
    decodeStream("iso-8859-1"),
    csv({
      delimiter: ";",
      trim: true,
      columns: true,
    }),
    transformData(async (data) => {
      let [gestionnaire, formateur] = await Promise.all([
        Annuaire.findOne({ siret: data["SIRET_gestionnaire"] }),
        Annuaire.findOne({ siret: data["SIRET_lieu_enseignement"] }),
      ]);

      return [
        {
          siret: data["SIRET_gestionnaire"],
          uais: [data["UAI_gestionnaire"]],
          relations: [
            ...(formateur
              ? [
                  {
                    siret: formateur.siret,
                    annuaire: !!formateur,
                    label: formateur ? formateur.raison_sociale : data["nom_lieu_enseignement"],
                    type: "formateur",
                  },
                ]
              : []),
          ],
        },
        {
          siret: data["SIRET_lieu_enseignement"],
          uais: [data["UAI_lieu_enseignement"]],
          relations: [
            ...(gestionnaire
              ? [
                  {
                    siret: gestionnaire.siret,
                    annuaire: !!gestionnaire,
                    label: gestionnaire ? gestionnaire.raison_sociale : data["CFA_gestionnaire"],
                    type: "gestionnaire",
                  },
                ]
              : []),
          ],
        },
      ];
    }),
    flattenArray(),
    filterData((data) => {
      return filters.siret ? filters.siret === data.siret : !!data;
    }),
    { promisify: false }
  );
};
