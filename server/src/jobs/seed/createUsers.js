const logger = require("../../common/logger");

module.exports = async (users) => {
  //await users.createUser("testUser", "password");
  await users.createUser("ed", "password", { permissions: { isAdmin: true } });
  //logger.info(`User 'testUser' with password 'password' is successfully created `);
  logger.info(`admin is successfully created `);
};
