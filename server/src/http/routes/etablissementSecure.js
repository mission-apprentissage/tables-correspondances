const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { Etablissement } = require("../../common/model");
const logger = require("../../common/logger");
const Boom = require("boom");

/**
 * Schema for validation
 */
const etablissementSchema = Joi.object({
  num_academie: Joi.number().required(),
}).unknown();

/**
 * Sample entity route module for POST / PUT / DELETE entity
 */
module.exports = () => {
  const router = express.Router();

  /**
   * Add/Post an item validated by schema createEtablissement /etablissement POST
   */
  router.post(
    "/etablissement",
    tryCatch(async ({ body, user }, res) => {
      await etablissementSchema.validateAsync(body, { abortEarly: false });

      let hasRightToEdit = user.isAdmin;
      if (!hasRightToEdit) {
        const listAcademie = user.academie.split(",");
        hasRightToEdit = listAcademie.includes(`${body.num_academie}`);
      }
      if (!hasRightToEdit) {
        throw Boom.unauthorized();
      }

      // TODO BELOW CHECK IF ALREADY EXIST
      // const exist = await MnaFormation.findOne({
      //   cfd: body.cfd,
      //   code_postal: body.code_postal,
      //   uai_formation: body.uai_formation,
      // });
      // if (exist) {
      //   Boom.conflict("La formation existe déjà");
      // }

      const item = body;
      logger.info("Adding new etablissement: ", item);

      const formation = new Etablissement(body);

      await formation.save();

      // return new formation
      res.json(formation);
    })
  );

  /**
   * Update an item validated by schema updateEtablissement etablissement/{id} PUT
   */
  router.put(
    "/etablissement/:id",
    tryCatch(async ({ body, user, params }, res) => {
      const itemId = params.id;

      const formation = await Etablissement.findById(itemId);
      let hasRightToEdit = user.isAdmin;
      if (!hasRightToEdit) {
        const listAcademie = user.academie.split(",");
        hasRightToEdit = listAcademie.includes(`${formation.num_academie}`);
      }
      if (!hasRightToEdit) {
        throw Boom.unauthorized();
      }

      logger.info("Updating new item: ", body);
      const result = await Etablissement.findOneAndUpdate({ _id: itemId }, body, { new: true });
      res.json(result);
    })
  );

  /**
   * Delete an item by id deleteEtablissement etablissement/{id} DELETE
   */
  router.delete(
    "/etablissement/:id",
    tryCatch(async ({ user, params }, res) => {
      const itemId = params.id;

      const formation = await Etablissement.findById(itemId);
      let hasRightToEdit = user.isAdmin;
      if (!hasRightToEdit) {
        const listAcademie = user.academie.split(",");
        hasRightToEdit = listAcademie.includes(`${formation.num_academie}`);
      }
      if (!hasRightToEdit) {
        throw Boom.unauthorized();
      }

      await Etablissement.deleteOne({ id: itemId });
      res.json({ message: `Etablissement ${itemId} deleted !` });
    })
  );

  return router;
};
