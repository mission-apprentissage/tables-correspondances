const logger = require("../../../common/logger");
const { etablissementService } = require("../../../logic/services/etablissementService");
// const { wait } = require("../../../common/utils/miscUtils");

const run = async (model, filter = {}) => {
  await performUpdates(model, filter);
};

const performUpdates = async (model, filter = {}) => {
  // const invalidEtablissements = [];
  // const notUpdatedEtablissements = [];
  // const updatedEtablissements = [];

  let offset = 0;
  let limit = 1;
  let computed = 0;
  let nbEtablissements = 10;

  while (computed < nbEtablissements) {
    let { docs, total } = await model.paginate(filter, { offset, limit });
    nbEtablissements = total;

    await Promise.all(
      docs.map(async (etablissement) => {
        computed += 1;
        const { updates, etablissement: updatedEtablissement, error } = await etablissementService(etablissement._doc);
        if (error) {
          etablissement.update_error = error;
          await model.findOneAndUpdate({ _id: etablissement._id }, etablissement, { new: true });
          // invalidEtablissements.push({ id: etablissement._id, cfd: etablissement.cfd, error });
          return;
        }

        if (!updates) {
          // notUpdatedEtablissements.push({ id: etablissement._id, cfd: etablissement.cfd });
          return;
        }

        try {
          updatedEtablissement.last_update_at = Date.now();
          await model.findOneAndUpdate({ _id: etablissement._id }, updatedEtablissement, { new: true });
          // updatedEtablissements.push({
          //   id: etablissement._id,
          //   cfd: etablissement.cfd,
          //   updates: JSON.stringify(updates),
          // });
        } catch (error) {
          logger.error(error);
        }
      })
    );

    offset += limit;

    logger.info(`progress ${computed}/${total}`);
  }

  // return { invalidEtablissements, updatedEtablissements, notUpdatedEtablissements };
  return true;
};

module.exports = { run, performUpdates };
