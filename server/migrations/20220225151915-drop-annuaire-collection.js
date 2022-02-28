module.exports = {
  async up(db) {
    await db.collection("annuaire").drop();
  },

  async down() {
    // can't restore previous state
    return Promise.resolve("ok");
  },
};
