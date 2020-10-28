const path = require("path");
const XLSX = require("xlsx");

class FileManager {
  getXLSXFile() {
    const filePath = path.join(__dirname, "./ListeCFA_sifa_avecsiret.xlsx");

    const jsonArray = this.getXLSX(filePath);

    return jsonArray;
  }

  getXLSX(filePath) {
    try {
      const { sheet_name_list, workbook } = this.readXLSXFile(filePath);
      const worksheet = workbook.Sheets[sheet_name_list[0]];

      const jsonSheetArray = XLSX.utils.sheet_to_json(worksheet, {
        header: [
          "code_gestion",
          "numero_uai",
          "mel",
          "denomination_principale_uai",
          "patronyme_uai",
          "adresse_uai",
          "code_postal_uai",
          "localite_acheminement_uai",
          "numero_telephone_uai",
          "mel_uai",
          "enquete",
          "nature_uai",
          "specificite_uai",
          "nouveau",
          "numero_siren_siret_uai",
        ],
        range: 1,
        raw: false,
      });

      return jsonSheetArray;
    } catch (err) {
      return null;
    }
  }

  readXLSXFile(localPath) {
    const workbook = XLSX.readFile(localPath, { codepage: 65001 });

    return { sheet_name_list: workbook.SheetNames, workbook };
  }
}

const fileManager = new FileManager();
module.exports = fileManager;
