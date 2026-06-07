const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Message = require('../models/Message.model');
const { getRedis } = require('../config/redis');

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -resetPasswordToken -resetPasswordExpiry');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();

    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  const checkMessageRateLimit = async (userId) => {
  const redis = getRedis();
  const key = `ratelimit:messages:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
    return count <= 30; // max 30 messages per minute
  };

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    const redis = getRedis();

    try {
      // Mark user as online
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: true,
        lastSeen: null
      });

      // Store socket id in Redis
      await redis.set(`socket:${socket.user._id}`, socket.id);

      // Notify all users this user is online
      io.emit('user_online', {
        userId: socket.user._id,
        username: socket.user.username,
        name: socket.user.name,
        avatar: socket.user.avatar
      });

    } catch (error) {
      console.error('Connection error:', error.message);
    }

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { content } = data;

        if (!content || content.trim() === '') return;
        const allowed = await checkMessageRateLimit(socket.user._id);
        if (!allowed) {
          socket.emit('error', { message: 'Slow down. Max 30 messages per minute.' });
          return;
        }

        if (content.length > 1000) {
          socket.emit('error', { message: 'Message too long' });
          return;
        }

        // Save to MongoDB
        const message = await Message.create({
          content: content.trim(),
          sender: socket.user._id
        });

        // Populate sender details
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name username avatar');

        // Emit to ALL connected users including sender
        io.emit('receive_message', populatedMessage);

      } catch (error) {
        console.error('Message error:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', () => {
      socket.broadcast.emit('typing', {
        userId: socket.user._id,
        username: socket.user.username
      });
    });

    // Handle stop typing
    socket.on('stop_typing', () => {
      socket.broadcast.emit('stop_typing', {
        userId: socket.user._id,
        username: socket.user.username
      });
    });

    // Handle message deletion
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.sender.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Not authorized to delete this message' });
          return;
        }

        await message.deleteOne();

        // Notify all users to remove this message
        io.emit('message_deleted', { messageId });

      } catch (error) {
        console.error('Delete error:', error.message);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);

      try {
        // Mark user as offline
        await User.findByIdAndUpdate(socket.user._id, {
          isOnline: false,
          lastSeen: new Date()
        });

        // Remove socket from Redis
        await redis.del(`socket:${socket.user._id}`);

        // Notify all users this user is offline
        io.emit('user_offline', {
          userId: socket.user._id,
          username: socket.user.username,
          lastSeen: new Date()
        });

      } catch (error) {
        console.error('Disconnect error:', error.message);
      }
    });
  });

  return io;
};

module.exports = initializeSocket;