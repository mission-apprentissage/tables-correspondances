const { Schema } = require("mongoose");

let statsProps = {
  nbSirens: {
    type: Number,
    required: true,
  },
  nbSirets: {
    type: Number,
    required: true,
  },
  nbSiretsGestionnairesEtFormateurs: {
    type: Number,
    required: true,
  },
  nbSiretsGestionnaires: {
    type: Number,
    required: true,
  },
  nbSiretsFormateurs: {
    type: Number,
    required: true,
  },
  nbSiretsSansUAIs: {
    type: Number,
    required: true,
  },
  nbSiretsAvecPlusieursUAIs: {
    type: Number,
    required: true,
  },
};

module.exports = {
  __v: { type: Number, select: false },
  created_at: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  referentiels: {
    default: [],
    type: [
      new Schema(
        {
          name: {
            type: String,
            enum: ["dgefp", "depp", "catalogue"],
            required: true,
          },
          nbSirens: {
            type: Number,
            required: true,
          },
          nbSirets: {
            type: Number,
            required: true,
          },
        },
        { _id: false }
      ),
    ],
  },
  globale: {
    required: true,
    type: new Schema(statsProps, { _id: false }),
  },
  academies: {
    required: true,
    type: [
      new Schema(
        {
          academie: {
            type: new Schema(
              {
                code: {
                  type: String,
                  required: true,
                },
                nom: {
                  type: String,
                  required: true,
                },
              },
              { _id: false }
            ),
          },
          ...statsProps,
        },
        { _id: false }
      ),
    ],
  },
};
