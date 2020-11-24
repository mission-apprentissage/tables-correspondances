const { asyncForEach } = require("../../common/utils/asyncUtils");
const { PsCoverage } = require("../../common/model");
const matcher = require("./utils/matcher");

async function formatAndUpdate(formation) {
  if (
    !formation.matching_uai.find((x) => x.data_length > 0) &&
    !formation.matching_cfd.find((x) => x.data_length > 0)
  ) {
    logger.info("No matching found");
    await PsCoverage.findByIdAndUpdate(formation.formation._id, {
      matching_type: null,
    });
    return;
  }
  if (!formation.matching_uai.find((x) => x.data_length > 0)) {
    // traitement CFD
    await updateDB(formation.formation, formation.matching_cfd);
  } else {
    // traitement UAI
    await updateDB(formation.formation, formation.matching_uai);
  }
}

async function updateDB(formation, matching) {
  const found = matching.find((x) => x.data_length === 1);
  if (found) {
    await PsCoverage.findByIdAndUpdate(formation._id, {
      matching_type: "6",
      matching_mna_formation: found.data,
    });
    logger.info(`Matching found, strengh : ${found.matching_strengh}`);
    return;
  } else {
    let matches = matching
      .filter((x) => x.data_length > 0)
      .reduce((acc, item) => {
        if (!acc || item.data_length < acc.data_length) {
          acc = item;
        }
        return acc;
      });

    await PsCoverage.findByIdAndUpdate(formation._id, {
      matching_type: `${matches.matching_strengh}`,
      matching_mna_formation: matches.data,
    });
    logger.info(`Matching found, strengh : ${matches.matching_strengh}`);
  }
}

module.exports = async (catalogue) => {
  const formations = await PsCoverage.find().lean();
  const catalogue = await catalogue.getEtablissements();

  await asyncForEach(formations, async (formation, index) => {
    logger.info(
      `formation #${index + 1} : ${formation.libelle_uai_affilie}, MEF : ${formation.code_mef_10}, CFD : ${
        formation.CFD_VALEUR
      }/${formation.code_cfd}`
    );

    const result = matcher(formation, catalogue);

    await formatAndUpdate(result);
  });
};
