const csvToJson = require("convert-csv-to-json");
const fs = require("fs-extra");
const axios = require("axios");
const logger = require("../../common/logger");

const getJsonFromCsvFile = (localPath, delimiter = ";") => {
  csvToJson.fieldDelimiter(delimiter);
  return csvToJson.getJsonFromCsv(localPath);
};
module.exports.getJsonFromCsvFile = getJsonFromCsvFile;

const downloadFile = async (url, to) => {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(to);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (e) {
    logger.error(`unable to download file ${url}`);
    return null;
  }
};

module.exports.downloadFile = downloadFile;
