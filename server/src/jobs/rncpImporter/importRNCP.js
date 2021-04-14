const logger = require("../../common/logger");
// const kitApprentissageController = require("./kitApprentissageController");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { FicheRncp } = require("../../common/model/index");
const { getJsonFromCsvFile } = require("../../common/utils/fileUtils");
// const { getFileFromS3 } = require("../../common/utils/awsUtils");
const parseFichesFile = require("./parseFichesFile");
const path = require("path");
const config = require("config");
let Client = require("ssh2-sftp-client");
const { sortBy } = require("lodash");
let sftp = new Client();

const isEligibleApprentissage = (fiche) => {
  if (!fiche) {
    return false;
  }

  if (fiche.type_enregistrement === "Enregistrement de droit") {
    return true;
  }

  if (fiche.type_enregistrement === "Enregistrement sur demande" && fiche.si_jury_ca) {
    return true;
  }

  return false;
};

const downloadFromFtp = async () => {
  try {
    await sftp.connect({
      host: config.franceCompetences.host,
      port: config.franceCompetences.port,
      username: config.franceCompetences.username,
      password: config.franceCompetences.password,
    });

    const list = await sftp.list("/xml_export");
    const V2files = list.filter((f) => new RegExp("export_fiches_RNCP_V2_0_(.)*.xml").test(f.name));
    // eslint-disable-next-line no-unused-vars
    const [file, ...rest] = sortBy(V2files, ["name"]).reverse();
    return sftp.sftp.createReadStream(`/xml_export/${file.name}`);
  } catch (err) {
    console.log(err);
  }
};

const importerRncpCfdFile = (fileName) => {
  return getJsonFromCsvFile(path.join(__dirname, fileName))
    .map((fk) => ({
      code_rncp: fk["Code RNCP"],
      cfds: [fk["Code Diplome"]],
    }))
    .filter((e) => e.code_rncp !== "NR");
};

const getFichesRncp = async () => {
  const fichesXMLInputStream = await downloadFromFtp(); // getFileFromS3("mna-services/features/rncp/export_fiches_RNCP_V2_0_latest.xml");
  logger.info("Parsing Fiches XML");
  let { fiches: fichesXML } = await parseFichesFile(fichesXMLInputStream);
  sftp.end();

  const rncpCfdKit = importerRncpCfdFile("./assets/CodeDiplome_RNCP_latest_kit.csv");
  const rncpCfdMna = importerRncpCfdFile("./assets/CodeDiplome_RNCP_latest_mna.csv");

  const rncpCfd = [...rncpCfdKit, ...rncpCfdMna].reduce((acc, cur) => {
    const existType = acc.find((a) => a.code_rncp === cur.code_rncp);
    if (existType) {
      existType.cfds = [...existType.cfds, ...cur.cfds];
      return acc;
    }

    acc.push({
      code_rncp: cur.code_rncp,
      cfds: cur.cfds,
    });
    return acc;
  }, []);

  const referentiel = fichesXML.map((ficheXML) => {
    const { cfds } = rncpCfd.find((i) => i.code_rncp === ficheXML.code_rncp) || { cfds: null };
    return {
      ...ficheXML,
      eligible_apprentissage: isEligibleApprentissage(ficheXML),
      cfds,
    };
  });

  // console.log(referentiel);

  return referentiel;
};

// eslint-disable-next-line no-unused-vars
module.exports = async (localPath = null) => {
  logger.info("Loading Kit Apprentissage FC - RNCP referentiel...");
  const fichesRncp = await getFichesRncp();
  logger.info("Add fiches to db...");

  try {
    await asyncForEach(fichesRncp, async (fiche) => {
      try {
        const exist = await FicheRncp.findOne({ code_rncp: fiche.code_rncp });
        if (exist) {
          await FicheRncp.findOneAndUpdate({ _id: exist._id }, { ...fiche, last_update_at: Date.now() }, { new: true });
          logger.info(`RNCP fiche '${fiche.code_rncp}' successfully updated in db`);
        } else {
          logger.info(`RNCP fiche '${fiche.code_rncp}' not found`);
          const ficheRncpToAdd = new FicheRncp(fiche);
          await ficheRncpToAdd.save();
          logger.info(`Fiche Rncp '${ficheRncpToAdd.id}' successfully added`);
        }
      } catch (error) {
        console.log(error);
      }
    });
    logger.info(`Importing RNCP fiches into db Succeed`);
  } catch (error) {
    logger.error(error);
    logger.error(`Importing RNCP fiches into db Failed`);
  }
};
