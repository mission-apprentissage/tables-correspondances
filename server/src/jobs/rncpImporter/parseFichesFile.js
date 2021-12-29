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

const generateVoixAccess = (fiche) => {
  const voixAcess = [];
  if (fiche.SI_JURY_CL && fiche.SI_JURY_CL === "Oui") {
    voixAcess.push({
      code_libelle: "CANDIDATURE",
      si_jury: "Par candidature individuelle",
    });
  }
  if (fiche.SI_JURY_CA && fiche.SI_JURY_CA === "Oui") {
    voixAcess.push({
      code_libelle: "CONTRATA",
      si_jury: "En contrat d’apprentissage",
    });
  }
  if (fiche.SI_JURY_CQ && fiche.SI_JURY_CQ === "Oui") {
    voixAcess.push({
      code_libelle: "CONTRATP",
      si_jury: "En contrat de professionnalisation",
    });
  }
  if (fiche.SI_JURY_FI && fiche.SI_JURY_FI === "Oui") {
    voixAcess.push({
      code_libelle: "ELEVE",
      si_jury: "Après un parcours de formation sous statut d’élève ou d’étudiant",
    });
  }
  if (fiche.SI_JURY_VAE && fiche.SI_JURY_VAE === "Oui") {
    voixAcess.push({
      code_libelle: "EXP",
      si_jury: "Par expérience",
    });
  }
  if (fiche.SI_JURY_FC && fiche.SI_JURY_FC === "Oui") {
    voixAcess.push({
      code_libelle: "PFC",
      si_jury: "Après un parcours de formation continue",
    });
  }
};

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

  const d = _.pick(data, [
    "NUMERO_FICHE",
    "INTITULE",
    "CERTIFICATEURS",
    "CODES_ROME",
    "PARTENAIRES",
    "TYPE_ENREGISTREMENT",
    "SI_JURY_CL",
    "SI_JURY_CA",
    "SI_JURY_CQ",
    "SI_JURY_FI",
    "SI_JURY_VAE",
    "SI_JURY_FC",
    "DATE_FIN_ENREGISTREMENT",
    "ACTIF",
    "ETAT_FICHE",
    "NOMENCLATURE_EUROPE",
    "ABREGE",
    "ANCIENNE_CERTIFICATION",
    "NOUVELLE_CERTIFICATION",
    "CODES_NSF",
    "BLOCS_COMPETENCES",
  ]);
  // console.log(d);
  return {
    code_rncp: d.NUMERO_FICHE,
    intitule_diplome: d.INTITULE,
    date_fin_validite_enregistrement: d.DATE_FIN_ENREGISTREMENT,
    active_inactive: d.ACTIF === "Oui" ? "ACTIVE" : "INACTIVE",
    etat_fiche_rncp: d.ETAT_FICHE,
    niveau_europe: d.NOMENCLATURE_EUROPE?.INTITULE,
    code_type_certif: d.ABREGE?.CODE,
    type_certif: d.ABREGE?.LIBELLE,
    ancienne_fiche: d.ANCIENNE_CERTIFICATION,
    nouvelle_fiche: d.NOUVELLE_CERTIFICATION,
    type_enregistrement: d.TYPE_ENREGISTREMENT,
    certificateurs: d.CERTIFICATEURS?.map((c) => ({
      certificateur: c.NOM_CERTIFICATEUR,
      siret_certificateur: c.SIRET_CERTIFICATEUR,
    })),
    nsf_code: d.CODES_NSF ? (Array.isArray(d.CODES_NSF.NSF) ? d.CODES_NSF.NSF[0]?.CODE : d.CODES_NSF.NSF.CODE) : null, // FIXME should be an array
    nsf_libelle: d.CODES_NSF
      ? Array.isArray(d.CODES_NSF.NSF)
        ? d.CODES_NSF.NSF[0]?.INTITULE
        : d.CODES_NSF.NSF.INTITULE
      : null, // FIXME should be an array
    romes: d.CODES_ROME?.map((r) => ({
      rome: r.CODE,
      libelle: r.LIBELLE,
    })),
    blocs_competences: d.BLOCS_COMPETENCES
      ? Array.isArray(d.BLOCS_COMPETENCES.BLOC_COMPETENCES)
        ? d.BLOCS_COMPETENCES.BLOC_COMPETENCES.map((b) => ({
            numero_bloc: b.CODE,
            intitule: b.LIBELLE,
            liste_competences: b.LISTE_COMPETENCES,
            modalites_evaluation: b.MODALITES_EVALUATION,
          }))
        : {
            numero_bloc: d.BLOCS_COMPETENCES.BLOC_COMPETENCES.CODE,
            intitule: d.BLOCS_COMPETENCES.BLOC_COMPETENCES.LIBELLE,
            liste_competences: d.BLOCS_COMPETENCES.BLOC_COMPETENCES.LISTE_COMPETENCES,
            modalites_evaluation: d.BLOCS_COMPETENCES.BLOC_COMPETENCES.MODALITES_EVALUATION,
          }
      : null,
    voix_acces: generateVoixAccess(d),
    si_jury_ca: d.SI_JURY_CA,
    partenaires: d.PARTENAIRES?.map((p) => ({
      Nom_Partenaire: p.NOM_PARTENAIRE,
      Siret_Partenaire: p.SIRET_PARTENAIRE,
      Habilitation_Partenaire: p.HABILITATION_PARTENAIRE,
    })),
    cfds: [],
  };
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
        logger.error(`Unable to load fiche from xml due to ${e.message}`);
        stats.errors++;
        return {};
      }
    }),
    ignoreEmpty(),
    accumulate(fiches)
  );

  return { fiches, stats };
};
