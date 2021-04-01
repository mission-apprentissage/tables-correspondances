const csv = require("csv-parse");
const { oleoduc, groupData, writeData } = require("oleoduc");
const logger = require("../../common/logger");
const { ConventionFile } = require("../../common/model/index");
const { getOvhFileAsStream } = require("../../common/utils/ovhUtils");

module.exports = async (options = {}) => {
  let getStream = options.getStream || getOvhFileAsStream;

  async function parseCSVAndInsert(type, file, parseOptions = {}) {
    let stream = await getStream(file);

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
          // Using raw collection to insert documents because Mongoose insertMany is very slow
          // https://github.com/Automattic/mongoose/issues/8215
          return ConventionFile.collection.insertMany(docs.map((d) => ({ ...d, type })));
        },
        { parallel: 5 }
      )
    );
  }

  return Promise.all([
    parseCSVAndInsert("DATADOCK", "convention/BaseDataDock-latest.csv"),
    parseCSVAndInsert("DEPP", "convention/CFASousConvRegionale_latest.csv"),
    parseCSVAndInsert("DGEFP", "convention/DGEFP - Extraction au 10 01 2020.csv"),
    parseCSVAndInsert("DATAGOUV", "convention/latest_public_ofs.csv", {
      columns: (header) => header.map((column) => column.replace(/ /g, "")),
    }),
  ]);
};
