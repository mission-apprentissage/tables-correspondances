const { runScript } = require("../scriptWrapper");

runScript(async ({ catalogue }) => {
  await psCoverage(catalogue);
});
