const rateLimit = require('express-rate-limit');

const shortenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user._id.toString(),
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests. Try again later.'
    });
  }
});

module.exports = { shortenLimiter };