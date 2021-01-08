const { oleoduc, filterObject, transformData, csvStream, jsonStream, writeData } = require("oleoduc");
const { Readable } = require("stream");
const csv = require("csv-parser");
const env = require("env-var");
const { getEtablissementStatus } = require("./utils/entrepriseAPI")(env.get("API_ENTREPRISE_KEY").asString());

const csvOptions = {
  separator: ";",
  mapHeaders: ({ header }) => header.replace(/ /g, ""),
};

const buildSiret = (data) => `${data.siren}${data.num_etablissement}`;

module.exports = {
  exportAnomalies: (input, output, options = {}) => {
    return oleoduc(
      input,
      csv(csvOptions),
      filterObject((data) => data.cfa === "Oui"),
      transformData(
        async (data) => {
          let siret = buildSiret(data);
          let status = await getEtablissementStatus(siret);

          return status !== "actif" ? { siret, status_siret: status } : null;
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
      filterObject((data) => data.cfa === "Oui"),
      writeData(async (data) => {
        let siret = buildSiret(data);

        let index = etablissements.findIndex((e) => e.siret === siret);
        if (index === -1) {
          etablissements.push({ siret, nom: data.raison_sociale, nombre: 1 });
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
