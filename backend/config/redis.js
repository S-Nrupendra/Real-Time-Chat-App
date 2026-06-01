const Redis = require('ioredis');

let redis;

const connectRedis = () => {
  redis = new Redis(process.env.REDIS_URL);

  redis.on('connect', () => {
    console.log('Redis Connected');
  });

  redis.on('error', (err) => {
    console.error('Redis Error:', err.message);
  });
};

const getRedis = () => redis;

module.exports = connectRedis;
module.exports.getRedis = getRedis;