const logger = require("../../../common/logger");
const { etablissementService } = require("../../../logic/services/etablissementService");
// const { wait } = require("../../../common/utils/miscUtils");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { Etablissement } = require("../../../common/model/index");

const run = async (filter = {}, options = null) => {
  await performUpdates(filter, options);
};

const performUpdates = async (filter = {}, options = null) => {
  // const invalidEtablissements = [];
  // const notUpdatedEtablissements = [];
  // const updatedEtablissements = [];

  let etablissementServiceOptions = options || {
    withHistoryUpdate: true,
    scope: { siret: true, location: true, geoloc: true, conventionnement: true },
  };

  const etablissements = await Etablissement.find(filter);

  logger.info(JSON.stringify(etablissementServiceOptions), etablissements.length);
  let count = 0;
  await asyncForEach(etablissements, async (etablissement) => {
    try {
      const { updates, etablissement: updatedEtablissement, error } = await etablissementService(
        etablissement._doc,
        etablissementServiceOptions
      );

      count++;

      if (error) {
        etablissement.update_error = error;
        await Etablissement.findOneAndUpdate({ _id: etablissement._id }, etablissement, { new: true });
        logger.error(`${count}: Etablissement ${etablissement._id} errored`, error);
      } else if (!updates) {
        // Do noting
        logger.info(`${count}: Etablissement ${etablissement._id} nothing to do`);
      } else {
        updatedEtablissement.last_update_at = Date.now();
        await Etablissement.findOneAndUpdate({ _id: etablissement._id }, updatedEtablissement, { new: true });
        logger.info(`${count}: Etablissement ${etablissement._id} updated`);
      }
    } catch (error) {
      logger.error(error);
    }
  });

  // let offset = 0;
  // let limit = 1;
  // let computed = 0;
  // let nbEtablissements = 10;

  // while (computed < nbEtablissements) {
  //   let { docs, total } = await model.paginate(filter, { offset, limit });
  //   nbEtablissements = total;

  //   await Promise.all(
  //     docs.map(async (etablissement) => {
  //       computed += 1;
  //       const { updates, etablissement: updatedEtablissement, error } = await etablissementService(etablissement._doc);
  //       if (error) {
  //         etablissement.update_error = error;
  //         await model.findOneAndUpdate({ _id: etablissement._id }, etablissement, { new: true });
  //         // invalidEtablissements.push({ id: etablissement._id, cfd: etablissement.cfd, error });
  //         return;
  //       }

  //       if (!updates) {
  //         // notUpdatedEtablissements.push({ id: etablissement._id, cfd: etablissement.cfd });
  //         return;
  //       }

  //       try {
  //         updatedEtablissement.last_update_at = Date.now();
  //         await model.findOneAndUpdate({ _id: etablissement._id }, updatedEtablissement, { new: true });
  //         // updatedEtablissements.push({
  //         //   id: etablissement._id,
  //         //   cfd: etablissement.cfd,
  //         //   updates: JSON.stringify(updates),
  //         // });
  //       } catch (error) {
  //         logger.error(error);
  //       }
  //     })
  //   );

  //   offset += limit;

  //   logger.info(`progress ${computed}/${total}`);
  // }

  // return { invalidEtablissements, updatedEtablissements, notUpdatedEtablissements };
  return true;
};

module.exports = { run, performUpdates };
