const { RateLimiterMemory, RateLimiterQueue } = require("rate-limiter-flexible");

module.exports = (name, options = {}) => {
  let rateLimiter = new RateLimiterMemory({
    keyPrefix: name,
    points: options.nbRequests || 1,
    duration: options.durationInSeconds || 1,
  });

  let queue = new RateLimiterQueue(rateLimiter, {
    maxQueueSize: options.maxQueueSize || 25,
  });

  return async (callback) => {
    await queue.removeTokens(1);
    return callback(options.client);
  };
};
