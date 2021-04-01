const csv = require("csv-parse");
const { oleoduc, groupData, writeData } = require("oleoduc");
const logger = require("../../common/logger");
const { getOvhFileAsStream } = require("../../common/utils/ovhUtils");

async function parseCSVAndInsert(db, type, file, parseOptions = {}) {
  let stream = await getOvhFileAsStream(file);

  return oleoduc(
    stream,
    csv({
      trim: true,
      delimiter: ";",
      skip_empty_lines: true,
      columns: true,
      ...parseOptions,
    }),
    groupData({ size: 5 }),
    writeData(
      (docs) => {
        logger.debug(`Inserting new ${docs.length} documents with type ${type}`);
        return db.collection("conventionfiles").insertMany(docs.map((d) => ({ ...d, type })));
      },
      { parallel: 5 }
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
