/* eslint-disable no-unused-vars */
const { diff } = require("deep-object-diff");

const diffEtablissement = (previousEtablissementP, nextEtablissementP) => {
  const {
    _id: _id1,
    __v: __v1,
    updates_history: updates_history1,
    created_at: created_at1,
    last_update_at: last_update_at1,
    ...previousEtablissement
  } = previousEtablissementP;
  const {
    _id: _id2,
    __v: __v2,
    updates_history: updates_history2,
    created_at: created_at2,
    last_update_at: last_update_at2,
    ...nextEtablissement
  } = nextEtablissementP;

  const compare = diff(previousEtablissement, nextEtablissement);
  const keys = Object.keys(compare);

  if (keys.length === 0) {
    return { updates: null, keys: [] };
  }

  return { updates: compare, keys };
};

module.exports.diffEtablissement = diffEtablissement;
