const axios = require("axios");
const https = require("https");
const config = require("config");
const { parse: parseUrl } = require("url"); // eslint-disable-line node/no-deprecated-api

let getAuth = async (uri) => {
  let regExp = new RegExp(/^(https:\/\/)(.+):(.+):(.+)@(.*)$/);

  if (!regExp.test(uri)) {
    throw new Error("Invalid OVH URI");
  }

  let [, protocol, user, password, tenantId, authUrl] = uri.match(regExp);
  let response = await axios.post(`${protocol}${authUrl}`, {
    auth: {
      identity: {
        tenantId,
        methods: ["password"],
        password: {
          user: {
            name: user,
            password: password,
            domain: {
              name: "Default",
            },
          },
        },
      },
    },
  });

  let token = response.headers["x-subject-token"];
  let { endpoints } = response.data.token.catalog.find((c) => c.type === "object-store");
  let { url } = endpoints.find((s) => s.region === "GRA");

  return { token, baseUrl: url };
};

module.exports = {
  getFileAsStream: async (path) => {
    let { token, baseUrl } = await getAuth(config.ovh.storage.uri);

    return new Promise((resolve) => {
      let options = {
        ...parseUrl(`${baseUrl}${path}`),
        method: "GET",
        headers: {
          "X-Auth-Token": token,
          Accept: "application/json",
        },
      };

      let req = https.request(options, (res) => resolve(res));
      req.end();
    });
  },
};
