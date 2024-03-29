const { Readable } = require("stream");
const path = require("path");
const config = require("config");
const { emptyDir } = require("fs-extra");
const { connectToMongo } = require("../../src/common/mongodb");

const testDataDir = path.join(__dirname, "../../.local/test");
let mongoHolder = null;

const connectToMongoForTests = async () => {
  if (!mongoHolder) {
    const uri = config.mongodb.uri.split("tables-correspondances").join("tables-correspondances_test");
    mongoHolder = await connectToMongo(uri);
  }
  return mongoHolder;
};

let createStream = (content) => {
  let stream = new Readable({
    objectMode: true,
    read() {},
  });

  stream.push(content);
  stream.push(null);

  return stream;
};

module.exports = {
  connectToMongoForTests,
  cleanAll: () => {
    const models = require("../../src/common/model");
    return Promise.all([emptyDir(testDataDir), ...Object.values(models).map((m) => m.deleteMany())]);
  },
  createStream,
};
