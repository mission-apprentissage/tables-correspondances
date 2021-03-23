const logger = require("../../common/logger");

class Cache {
  constructor(cacheName) {
    this.name = cacheName;
    this.cache = {};
  }

  get(key) {
    return this.cache[key];
  }

  add(key, value) {
    logger.debug(`Key '${key}' added to cache ${this.name}`);
    this.cache[key] = value;
  }

  flush() {
    logger.debug(`Cache '${this.name} ' flushed`);
    this.cache = {};
  }
}

module.exports = Cache;
