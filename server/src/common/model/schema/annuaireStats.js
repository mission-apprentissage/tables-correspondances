const { Schema } = require("mongoose");

module.exports = {
  __v: { type: Number, select: false },
  created_at: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  stats: {
    type: Schema.Types.Mixed,
  },
};
