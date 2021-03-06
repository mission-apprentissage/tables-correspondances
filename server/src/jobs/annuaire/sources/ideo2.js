const { oleoduc, transformData, flattenArray, filterData } = require("oleoduc");
const csv = require("csv-parse");
const { isEmpty } = require("lodash");
const { decodeStream } = require("iconv-lite");
const { getOvhFileAsStream } = require("../../../common/utils/ovhUtils");

module.exports = async (custom = {}) => {
  let name = "ideo2";
  let input = custom.input || (await getOvhFileAsStream("annuaire/ONISEP-Ideo2-T_Export_complet.csv"));

  return {
    name,
    stream() {
      let memory = [];

      return oleoduc(
        input,
        decodeStream("iso-8859-1"),
        csv({
          delimiter: ";",
          trim: true,
          columns: true,
        }),
        filterData((data) => {
          let key = `${data["SIRET_gestionnaire"]}_${data["SIRET_lieu_enseignement"]}`;
          if (memory.includes(key)) {
            return null;
          }
          memory.push(key);
          return data;
        }),
        transformData(
          async (data) => {
            let siretFormateur = data["SIRET_lieu_enseignement"];
            let siretGestionnaire = data["SIRET_gestionnaire"];

            return [
              {
                selector: siretGestionnaire,
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
          },
          { parallel: 10 }
        ),
        flattenArray(),
        transformData((data) => ({ ...data, source: name })),
        { promisify: false }
      );
    },
  };
};
