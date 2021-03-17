const Joi = require("joi");

const customJoi = Joi.extend((joi) => ({
  type: "stringList",
  base: joi.array(),
  // eslint-disable-next-line no-unused-vars
  coerce(value, helpers) {
    return { value: value.split ? value.split(",") : value };
  },
}));

module.exports = {
  stringList: () => customJoi.stringList().items(Joi.string()).single(),
  password: () => Joi.string().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
};
