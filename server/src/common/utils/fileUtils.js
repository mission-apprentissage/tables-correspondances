const XLSX = require("xlsx");
const csvToJson = require("convert-csv-to-json-latin");
const path = require("path");
const fs = require("fs-extra");
const axios = require("axios");

const getJsonFromCsvFile = (localPath, delimiter = ";") => {
  csvToJson.fieldDelimiter(delimiter);
  return csvToJson.getJsonFromCsv(localPath);
};
module.exports.getJsonFromCsvFile = getJsonFromCsvFile;

const readXLSXFile = (localPath) => {
  const workbook = XLSX.readFile(localPath, { codepage: 65001 });
  return { sheet_name_list: workbook.SheetNames, workbook };
};
module.exports.readXLSXFile = readXLSXFile;

const createXlsx = async (worksheets = []) => {
  if (worksheets.length === 0) return;

  const workbook = XLSX.utils.book_new(); // Create a new blank workbook

  for (let i = 0; i < worksheets.length; i++) {
    const { name, content } = worksheets[i];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(content), name); // Add the worksheet to the workbook
  }
  return workbook;
};
module.exports.createXlsx = createXlsx;

const convertIntoBuffer = (workbook) => {
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};
module.exports.convertIntoBuffer = convertIntoBuffer;

const writeXlsxFile = async (workbook, filePath, fileName) => {
  const execWrite = () =>
    new Promise((resolve) => {
      XLSX.writeFileAsync(path.join(__dirname, `${filePath}/${fileName}`), workbook, (e) => {
        if (e) {
          console.error(e);
          throw new Error("La génération du fichier excel à échoué : ", e);
        }
        resolve();
      });
    });

  await execWrite();
};
module.exports.writeXlsxFile = writeXlsxFile;

const removeLine = (data, regex) => {
  return data
    .split("\n")
    .filter((val) => !regex.test(val))
    .join("\n");
};
module.exports.removeLine = removeLine;

const downloadFile = async (url, to) => {
  const writer = fs.createWriteStream(to);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};
module.exports.downloadFile = downloadFile;
