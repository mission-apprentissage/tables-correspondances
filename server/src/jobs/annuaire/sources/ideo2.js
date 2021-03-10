const { oleoduc, transformData, flattenArray } = require("oleoduc");
const csv = require("csv-parse");
const { decodeStream } = require("iconv-lite");
const { Annuaire } = require("../../../common/model");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let input = custom.input || (await getOvhFileAsStream("annuaire/ONISEP-Ideo2-T_Export_complet.csv"));

  return {
    stream() {
      return oleoduc(
        input,
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
              selector: data["SIRET_gestionnaire"],
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
              selector: data["SIRET_lieu_enseignement"],
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
        { promisify: false }
      );
    },
  };
};
