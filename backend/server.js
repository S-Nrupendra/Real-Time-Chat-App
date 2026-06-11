require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env' : '../.env' });
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const connectRedis = require('./config/redis');
const initializeSocket = require('./socket/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initializeSocket(server);

connectDB();
connectRedis();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;