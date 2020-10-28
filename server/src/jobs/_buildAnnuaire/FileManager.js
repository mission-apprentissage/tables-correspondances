const path = require("path");
const XLSX = require("xlsx");

class FileManager {
  getXLSXFile(xlsxPath, headers) {
    const filePath = path.join(__dirname, xlsxPath);

    const jsonArray = this.getXLSX(filePath, headers);

    return jsonArray;
  }

  getXLSX(filePath, headers) {
    try {
      const { sheet_name_list, workbook } = this.readXLSXFile(filePath);
      const worksheet = workbook.Sheets[sheet_name_list[0]];

      const jsonSheetArray = XLSX.utils.sheet_to_json(worksheet, {
        header: headers,
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
