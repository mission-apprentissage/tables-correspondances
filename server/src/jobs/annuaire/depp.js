const { oleoduc, transformData, csvStream, jsonStream, writeData } = require("oleoduc");
const { Readable } = require("stream");
const csv = require("csv-parser");
const env = require("env-var");
const validateUAI = require("./utils/validateUAI");
const { getEtablissementStatus } = require("./utils/entrepriseAPI")(env.get("API_ENTREPRISE_KEY").asString());

const csvOptions = {
  separator: "|",
};

module.exports = {
  exportAnomalies: (input, output, options = {}) => {
    return oleoduc(
      input,
      csv(csvOptions),
      transformData(
        async (data) => {
          let siret = data.numero_siren_siret_uai;
          let uai = data.numero_uai;

          let status = await getEtablissementStatus(siret);
          let statusUai = validateUAI(uai) ? "valide" : "invalide";

          return status !== "actif" ? { uai, status_uai: statusUai, siret, status_siret: status } : null;
        },
        { parallel: 15 }
      ),
      options.format === "csv" ? csvStream() : jsonStream(),
      output
    );
  },
  exportDoublons: async (input, output, options = {}) => {
    let etablissements = [];
    await oleoduc(
      input,
      csv(csvOptions),
      writeData(async (data) => {
        let siret = data.numero_siren_siret_uai;
        let uai = data.numero_uai;

        let index = etablissements.findIndex((e) => e.siret === siret);
        if (index === -1) {
          etablissements.push({ uai, siret, nom: data.patronyme_uai, nombre: 1 });
        } else {
          etablissements[index].nombre++;
        }
      })
    );

    return oleoduc(
      Readable.from(Object.values(etablissements).filter((e) => e.nombre > 1)),
      options.format === "csv" ? csvStream() : jsonStream(),
      output
    );
  },
};
