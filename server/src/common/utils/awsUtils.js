const AWS = require("aws-sdk");
const config = require("config");

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  region: "eu-west-3",
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const getFileFromS3 = (key) => {
  return s3.getObject({ Bucket: "mna-bucket", Key: key }).createReadStream();
};
module.exports.getFileFromS3 = getFileFromS3;
