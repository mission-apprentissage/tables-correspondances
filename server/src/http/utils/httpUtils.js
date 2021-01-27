module.exports = {
  sendJsonStream: (stream, res) => {
    res.setHeader("Content-Type", "application/json");
    stream.pipe(res);
  },
};
