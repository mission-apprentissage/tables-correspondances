const mongoose = require("mongoose");
const config = require("config");

let mongooseInstance = mongoose;
module.exports.connectToMongo = (mongoUri = config.mongodb.uri, mongooseInst = null) => {
  return new Promise((resolve, reject) => {
    console.log(`MongoDB: Connection to ${mongoUri}`);

    const mI = mongooseInst || mongooseInstance;
    // Set up default mongoose connection
    mI.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });

    // Get Mongoose to use the global promise library
    mI.Promise = global.Promise; // Get the default connection
    const db = mI.connection;

    // Bind connection to error event (to get notification of connection errors)
    db.on("error", (e) => {
      console.error("MongoDB: connection error:");
      reject(e);
    });

    db.on("close", (e) => {
      console.log("Error...close");
      reject(e);
    });
    db.on("error", (err) => {
      console.log("Error...error", err);
      reject(err);
    });
    db.on("disconnect", (err) => {
      console.log("Error...disconnect", err);
      reject(err);
    });
    db.on("disconnected", (err) => {
      console.log("Error...disconnected", err);
      reject(err);
    });
    db.on("parseError", (err) => {
      console.log("Error...parse", err);
      reject(err);
    });
    db.on("timeout", (err) => {
      console.log("Error...timeout", err);
      reject(err);
    });

    db.once("open", () => {
      console.log("MongoDB: Connected");
      resolve({ db });
    });
  });
};

module.exports.mongooseInstance = mongooseInstance;
module.exports.closeMongoConnection = (mongooseInst = mongoose) => mongooseInst.disconnect();
