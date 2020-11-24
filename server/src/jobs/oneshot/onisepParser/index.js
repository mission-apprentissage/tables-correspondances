const { pipeline, writeObject } = require("../../../common/utils/streamUtils");
const parseCSV = require("csv-parse");
const { runScript } = require("../../scriptWrapper");
const { getFileFromS3 } = require("../../../common/utils/awsUtils");
const config = require("config");

const createParser = () => {
  let catalogue = {};

  return {
    getData() {
      return catalogue;
    },
    loadCsvFile: async (inputStream) => {
      await pipeline(
        inputStream,
        parseCSV({
          delimiter: ";",
          skip_lines_with_error: true,
          skip_empty_lines: true,
          from_line: 2,
          columns: [
            "Identifiant_MNA",
            "siret_CFA_OFA",
            "Intitulé_SIRET_CFA-OFA",
            "siret_formateur",
            "Intitulé_Siret_formateur",
            "siren",
            "CFA_ou_OFA",
            "Organisme_eligible",
            "Organisme_certifié_2015",
            "Source",
            "Référencé_Parcousup",
            "Nom_formation",
            "OF_Habilité_RNCP",
            "Titre_RNCP",
            "Diplôme_ou_titre_visé",
            "Intitulé_du_diplôme_ou_titre",
            "Code_diplome_EN",
            "URL_redirection_formation",
            "FOR_LIBCONCAT",
            "Niveau_de_formation",
            "periode",
            "capacite",
            "email",
            "Uai",
            "codePostal",
            "codeCommuneInsee",
            "Nom_Academie_Siège",
            "Num_Academie",
            "Nom_Academie",
            "numDepartement",
          ],
        }),
        writeObject((line) => {
          if (line["Code_diplome_EN"] && line["URL_redirection_formation"]) {
            catalogue[line["Code_diplome_EN"]] = line["URL_redirection_formation"];
          }
        })
      );
    },
    getUrl: (codeDiplome) => {
      let res = catalogue[codeDiplome];
      return res ? res.url : null;
    },
  };
};

if (process.env.run) {
  runScript(async () => {
    const parser = await createParser();

    const inputStream = getFileFromS3(config.onisep);
    await parser.loadCsvFile(inputStream);
    const data = parser.getData();
    console.log(`found ${Object.keys(data).length} data`, data);
  });
}
