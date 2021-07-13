const { oleoduc, transformData, filterData } = require("oleoduc");
const { createSource } = require("../sources/sources");
const mergeStream = require("merge-stream");

module.exports = async () => {
  return {
    name: "gof",
    stream: async function () {
      let inputs = await Promise.all(
        ["deca", "catalogue", "sifa-ramsese"].map(async (name) => {
          let source = await createSource(name);
          return source.stream();
        })
      );

      return oleoduc(
        mergeStream(inputs),
        filterData((data) => data.selector),
        transformData((data) => {
          return {
            from: data.from,
            siret: data.selector,
          };
        }),
        { promisify: false }
      );
    },
  };
};
