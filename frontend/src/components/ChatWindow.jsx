import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import MessageBubble from './MessageBubble';

export default function ChatWindow() {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load message history on mount
  useEffect(() => {
    loadMessages(1);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    socket.on('typing', (data) => {
      if (data.userId === user?.id) return;
      setTyping(prev => {
        if (prev.find(u => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    });

    socket.on('stop_typing', (data) => {
      setTyping(prev => prev.filter(u => u.userId !== data.userId));
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_deleted');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [socket, user]);

  const loadMessages = async (pageNum) => {
    try {
      const res = await api.get(`/api/messages?page=${pageNum}&limit=20`);
      if (pageNum === 1) {
        setMessages(res.data.messages);
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages(prev => [...res.data.messages, ...prev]);
      }
      setHasMore(res.data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim() || !socket) return;

    socket.emit('send_message', { content: content.trim() });
    setContent('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('stop_typing');
    }
  };

  const handleTyping = (e) => {
    setContent(e.target.value);

    if (!socket) return;

    socket.emit('typing');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing');
    }, 2000);
  };

  const handleDelete = (messageId) => {
    if (!socket) return;
    socket.emit('delete_message', { messageId });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950">
      {/* Load more */}
      {hasMore && (
        <div className="text-center py-2">
          <button
            onClick={() => loadMessages(page + 1)}
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Load older messages
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble
              key={message._id}
              message={message}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* Typing indicators */}
        {typing.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm">
              <p className="text-gray-400 text-sm">
                {typing.map(u => u.username).join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={content}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition text-sm"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-medium text-sm transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}