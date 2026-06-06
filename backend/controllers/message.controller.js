const Message = require('../models/Message.model');
const { createError } = require('../middleware/error.middleware');

// @desc    Get message history (paginated)
// @route   GET /api/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .populate('sender', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Reverse so oldest is first (chat order)
    const orderedMessages = messages.reverse();

    const total = await Message.countDocuments();

    res.status(200).json({
      messages: orderedMessages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return next(createError('Message not found', 404));
    }

    // Check ownership
    if (message.sender.toString() !== req.user._id.toString()) {
      return next(createError('Not authorized to delete this message', 403));
    }

    await message.deleteOne();

    res.status(200).json({ message: 'Message deleted successfully' });

  } catch (error) {
    next(error);
  }
};

module.exports = { getMessages, deleteMessage };