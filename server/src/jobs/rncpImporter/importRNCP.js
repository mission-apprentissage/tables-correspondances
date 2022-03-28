const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { FicheRncp, BcnFormationDiplome } = require("../../common/model/index");
const { getJsonFromCsvFile } = require("../../common/utils/fileUtils");
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

const importerRncpCfdFile = async (filePath) => {
  const rncpCfdKit = [];
  const tmp = getJsonFromCsvFile(filePath)
    .map((fk) => ({
      code_rncp: fk["Code_RNCP"],
      cfds: [fk["Code_Diplome"]],
    }))
    .filter((e) => e.code_rncp !== "NR");

  for (let index = 0; index < tmp.length; index++) {
    const {
      code_rncp,
      cfds: [cfd],
    } = tmp[index];

    const exist = await BcnFormationDiplome.findOne({ FORMATION_DIPLOME: `${cfd}`.padStart(8, "0") });

    if (exist) {
      rncpCfdKit.push({ code_rncp, cfds: [`${cfd}`.padStart(8, "0")] });
    } else {
      console.log(`${cfd} has been skipped because it does not exist in BCN`);
    }
  }
  return rncpCfdKit;
};

const CFD_KIT_LOCAL_PATH = path.join(__dirname, "./assets", "CodeDiplome_RNCP_latest_kit.csv");

const getFichesRncp = async (cfdKitPath) => {
  const fichesXMLInputStream = await downloadFromFtp();
  logger.info("Parsing Fiches XML");
  let { fiches: fichesXML } = await parseFichesFile(fichesXMLInputStream);
  sftp.end();

  const rncpCfdKit = await importerRncpCfdFile(cfdKitPath ?? CFD_KIT_LOCAL_PATH);

  const rncpCfd = rncpCfdKit.reduce((acc, cur) => {
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

  return referentiel;
};

// eslint-disable-next-line no-unused-vars
module.exports = async (cfdKitPath = null) => {
  logger.info("Loading Kit Apprentissage FC - RNCP referentiel...");

  try {
    const fichesRncp = await getFichesRncp(cfdKitPath);
    logger.info("Add fiches to db...");

    await asyncForEach(fichesRncp, async (fiche) => {
      try {
        const exist = await FicheRncp.findOne({ code_rncp: fiche.code_rncp });
        if (exist) {
          await FicheRncp.findOneAndUpdate({ _id: exist._id }, { ...fiche, last_update_at: Date.now() }, { new: true });
          logger.debug(`RNCP fiche '${fiche.code_rncp}' successfully updated in db`);
        } else {
          logger.debug(`RNCP fiche '${fiche.code_rncp}' not found`);
          const ficheRncpToAdd = new FicheRncp(fiche);
          await ficheRncpToAdd.save();
          logger.debug(`Fiche Rncp '${ficheRncpToAdd.id}' successfully added`);
        }
      } catch (error) {
        logger.error(error);
      }
    });
    logger.info(`Importing RNCP fiches into db Succeed`);
  } catch (error) {
    logger.error(`Importing RNCP fiches into db Failed ${error}`);
  }
};
