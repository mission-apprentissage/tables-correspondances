const csvToJson = require("convert-csv-to-json");
const azureStorage = require("../../../common/azureStorage");
const path = require("path");
const env = require("env-var");
const fs = require("fs");
const { CodeIdccOpco, CodeEnCodesIdcc } = require("../../../../common/model");
const { asyncForEach } = require("../../../../common/utils/asyncUtils");

const referentielCodesEnCodesIdccFilePath = path.join(__dirname, "../assets/referentielCodesEnCodesIdcc.csv");
const referentielCodesIdccOpcoFilePath = path.join(__dirname, "../assets/referentielCodesIdccOpco.csv");

module.exports = async () => {
  try {
    // Check if referentielCodesEnCodesIdcc is in local folder, if not gets it from azure
    if (!fs.existsSync(referentielCodesEnCodesIdccFilePath)) {
      const storage = azureStorage(env.get("TABLES_CORRESPONDANCE_AZURE_STORAGE_CONNECTION_STRING").asString());
      await storage.saveBlobToFile(
        "opco-container",
        "referentielCodesEnCodesIdcc.csv",
        referentielCodesEnCodesIdccFilePath
      );
    }

    // Load csv referential data
    const referentielCodesEnCodesIdcc = csvToJson.getJsonFromCsv(referentielCodesEnCodesIdccFilePath);

    // drop previous data
    await CodeEnCodesIdcc.deleteMany({});

    await asyncForEach(referentielCodesEnCodesIdcc, async (item) => {
      const data = {
        cfd: item["Codelaformation"],
        libelle: item["Libellédelaformation"],
        codeCPNE: item["CodeCPNE"],
        libelleCPNE: item["LibelléCPNE"],
        codeIDCC: item["CodeIDCC"],
        valeur_finale: item["Valeurfinale"],
        statut: item["Statut"],
      };
      await new CodeEnCodesIdcc(data).save();
    });
  } catch (e) {
    console.error(e);
  }

  const referentielIdccsOpco = csvToJson.getJsonFromCsv(referentielCodesIdccOpcoFilePath);

  // drop previous data
  await CodeIdccOpco.deleteMany({});

  await asyncForEach(referentielIdccsOpco, async (idccOpco) => {
    const data = {
      IDCC: idccOpco["IDCC"],
      operateur_de_competences: idccOpco["Opérateurdecompétences"],
      libelle: idccOpco["Libellé"],
      obs: idccOpco["obs"],
    };
    await new CodeIdccOpco(data).save();
  });
};
