const catalogue = require("./assets/onisepUrls.json");

const findUrl = (cfd) => {
  const onisep_url = catalogue[cfd];
  if (!onisep_url) {
    return {
      result: {
        url: null,
      },
      messages: {
        url: "Non trouvé",
      },
    };
  }
  return {
    result: {
      url: onisep_url,
    },
    messages: {
      url: "Ok",
    },
  };
};

module.exports = { findUrl };
