const { runScript } = require("../scriptWrapper");
const psCoverage = require("./psCoverage");

runScript(async ({ catalogue }) => {
  await psCoverage(catalogue);
});
