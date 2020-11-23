const config = require("config");
const { getFileFromS3 } = require("../../../common/utils/awsUtils");
const createCatalogue = require("./onisepFileParser");

class OnisepController {
  constructor() {
    this.catalogue = createCatalogue();
  }

  async load() {
    const inputStream = getFileFromS3(config.onisep);
    await this.catalogue.loadCsvFile(inputStream);
  }

  async findUrl(cfd) {
    const onisep_url = await this.catalogue.getUrl(cfd);
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
  }
}

const onisepController = new OnisepController();
module.exports = onisepController;
