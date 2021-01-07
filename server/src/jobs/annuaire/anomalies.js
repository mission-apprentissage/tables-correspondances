const { createWriteStream } = require("fs");
const { oleoduc, filterObject, transformData } = require("oleoduc");
const csv = require("csv-parser");
const logger = require("../../common/logger");
const env = require("env-var");
const { transformObjectIntoCSV } = require("../../common/utils/streamUtils");
const validateUAI = require("./validateUAI");
const { getEtablissement } = require("./entrepriseAPI")(env.get("API_ENTREPRISE_KEY").asString());

const getEtablissementStatus = async (siret) => {
  if (!siret) {
    return "invalide";
  }

  try {
    const etablissement = await getEtablissement(siret);
    return etablissement.etat_administratif.value === "A" ? "actif" : "fermé";
  } catch (e) {
    logger.error(e);
    let errors = {
      451: "indisponible",
      404: "inconnu",
      422: "invalide",
    };
    return errors[e.response.status] || "erreur";
  }
};

module.exports = {
  exportInvalidSiretFromDEPP: async (inputStream, outputFile) => {
    await oleoduc(
      inputStream,
      csv({
        separator: "|",
      }),
      transformData(
        async (data) => {
          let siret = data.numero_siren_siret_uai;
          let uai = data.numero_uai;

          let status = await getEtablissementStatus(siret);
          let statusUai = validateUAI(uai) ? "valide" : "invalide";

          return status !== "actif" ? { uai: uai, status_uai: statusUai, siret, status_siret: status } : null;
        },
        { parallel: 15 }
      ),
      transformObjectIntoCSV(),
      createWriteStream(outputFile)
    );
  },

  exportInvalidSiretFromDGEFP: async (inputStream, outputFile) => {
    await oleoduc(
      inputStream,
      csv({
        separator: ";",
        mapHeaders: ({ header }) => header.replace(/ /g, ""),
      }),
      filterObject((data) => data.cfa === "Oui"),
      transformData(
        async (data) => {
          let siret = `${data.siren}${data.num_etablissement}`;
          let status = await getEtablissementStatus(siret);

          return status !== "actif" ? { siret, status_siret: status } : null;
        },
        { parallel: 15 }
      ),
      transformObjectIntoCSV(),
      createWriteStream(outputFile)
    );
  },
};
