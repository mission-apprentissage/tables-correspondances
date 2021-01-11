const logger = require("../../common/logger");

module.exports = async (users) => {
  const args = process.argv.slice(2);
  //await users.createUser("testUser", "password");
  await users.createUser(args[0], args[1], { permissions: { isAdmin: true } });
  //logger.info(`User 'testUser' with password 'password' is successfully created `);
  logger.info(`admin is successfully created `);
};
