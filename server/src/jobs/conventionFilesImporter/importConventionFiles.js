const csv = require("csv-parse");
const { oleoduc, writeData } = require("oleoduc");
const logger = require("../../common/logger");
const { getOvhFileAsStream } = require("../../common/utils/ovhUtils");

async function parseCSVAndInsert(db, type, file, parseOptions = {}) {
  await oleoduc(
    await getOvhFileAsStream(file),
    csv({
      trim: true,
      delimiter: ";",
      skip_empty_lines: true,
      columns: true,
      ...parseOptions,
    }),
    writeData(
      (data) => {
        logger.debug(`Inserting new document with type ${type}`);
        return db.collection("conventionfiles").insertOne(data);
      },
      { parallel: 10 }
    )
  );
}

module.exports = async (db) => {
  return Promise.all([
    parseCSVAndInsert(db, "DATADOCK", "convention/BaseDataDock-latest.csv"),
    parseCSVAndInsert(db, "DEPP", "convention/CFASousConvRegionale_latest.csv"),
    parseCSVAndInsert(db, "DGEFP", "convention/DGEFP - Extraction au 10 01 2020.csv"),
    parseCSVAndInsert(db, "DATAGOUV", "convention/latest_public_ofs.csv", {
      columns: (header) => header.map((column) => column.replace(/ /g, "")),
    }),
  ]);
};
