const _ = require("lodash");
const { Transform } = require("stream");
const { LineStream } = require("byline");
const logger = require("../../common/logger");
const util = require("util");
const xml2js = require("xml2js");
const { pipeline, transformObject, accumulate, ignoreEmpty, decodeStream } = require("../../common/utils/streamUtils");

const xmlToJson = util.promisify(
  new xml2js.Parser({
    explicitArray: false,
    explicitRoot: false,
  }).parseString
);

const convertXmlIntoJson = async (xml) => {
  let regroupTagsWithMultipleOccurences = (value) => {
    if (value && typeof value === "object") {
      Object.keys(value).forEach((key) => {
        if (["CERTIFICATEURS", "PARTENAIRES", "CODES_ROME"].includes(key)) {
          let nestedFieldName = Object.keys(value[key])[0];
          let nestedElement = value[key][nestedFieldName];
          value[key] = nestedElement.constructor !== Array ? [nestedElement] : nestedElement;
        }
      });
    }
  };

  let json = await xmlToJson(xml);

  let data = _.cloneDeepWith(json, regroupTagsWithMultipleOccurences);
  return _.pick(data, [
    "NUMERO_FICHE",
    "INTITULE",
    "CERTIFICATEURS",
    "CODES_ROME",
    "PARTENAIRES",
    "TYPE_ENREGISTREMENT",
    "SI_JURY_CA",
    "DATE_FIN_ENREGISTREMENT",
    "ACTIF",
    "ETAT_FICHE",
    "NOMENCLATURE_EUROPE",
    "ABREGE",
    "ANCIENNE_CERTIFICATION",
    "NOUVELLE_CERTIFICATION",
    "CODES_NSF",
  ]).map((d) => ({
    code_rncp: d.NUMERO_FICHE,
    intitule_diplome: d.INTITULE,
    date_fin_validite_enregistrement: d.DATE_FIN_ENREGISTREMENT,
    active_inactive: d.ACTIF === "Oui" ? "ACTIVE" : "INACTIVE",
    etat_fiche_rncp: d.ETAT_FICHE,
    niveau_europe: d.NOMENCLATURE_EUROPE.INTITULE,
    code_type_certif: d.ABREGE.CODE,
    type_certif: d.ABREGE.LIBELLE,
    ancienne_fiche: d.ANCIENNE_CERTIFICATION,
    nouvelle_fiche: d.NOUVELLE_CERTIFICATION,
    type_enregistrement: d.TYPE_ENREGISTREMENT,
    certificateurs: d.CERTIFICATEURS,
    nsf_code: d.CODES_NSF.NSF.CODE,
    nsf_libelle: d.CODES_NSF.NSF.INTITULE,
    romes: d.CODES_ROME,
    blocs_competences: [],
    voix_acces: [],
    si_jury_ca: d.SI_JURY_CA,
    partenaires: d.PARTENAIRES,
    cfds: [],
  }));
};

module.exports = async (inputStream) => {
  let xml = "";
  let partial = true;
  let fiches = [];
  let stats = {
    errors: 0,
    total: 0,
  };

  await pipeline(
    inputStream,
    decodeStream("UTF-8"),
    new LineStream(),
    new Transform({
      objectMode: true,
      transform: function (chunk, encoding, callback) {
        try {
          let line = chunk.trim();

          if (line.startsWith("<FICHE>")) {
            xml = line;
          } else {
            xml += line;
          }

          if (line.startsWith("</FICHE>")) {
            partial = false;
          }

          if (!partial) {
            this.push(xml);
            partial = true;
            xml = "";
          }
          callback();
        } catch (e) {
          callback(e);
        }
      },
    }),
    transformObject(async (xml) => {
      try {
        let json = await convertXmlIntoJson(xml);
        stats.total++;
        return json;
      } catch (e) {
        logger.warn(`Unable to load fiche from xml due to ${e.message}`);
        stats.errors++;
        return {};
      }
    }),
    ignoreEmpty(),
    accumulate(fiches)
  );

  return { fiches, stats };
};
