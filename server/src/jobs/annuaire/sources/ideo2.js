const { oleoduc, transformData, flattenArray } = require("oleoduc");
const csv = require("csv-parse");
const { isEmpty } = require("lodash");
const { decodeStream } = require("iconv-lite");
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
          let siretFormateur = data["SIRET_lieu_enseignement"];
          let siretGestionnaire = data["SIRET_gestionnaire"];

          return [
            {
              selector: siretGestionnaire,
              uais: [data["UAI_gestionnaire"]],
              relations: [
                ...(isEmpty(siretFormateur)
                  ? []
                  : [
                      {
                        siret: siretFormateur,
                        label: data["nom_lieu_enseignement"],
                        type: "formateur",
                      },
                    ]),
              ],
            },
            {
              selector: siretFormateur,
              uais: [data["UAI_lieu_enseignement"]],
              relations: [
                ...(isEmpty(siretGestionnaire)
                  ? []
                  : [
                      {
                        siret: siretGestionnaire,
                        label: data["CFA_gestionnaire"],
                        type: "gestionnaire",
                      },
                    ]),
              ],
            },
          ];
        }),
        flattenArray(),
        { promisify: false, parallel: 10 }
      );
    },
  };
};
