import { useAuth } from '../context/AuthContext';

export default function MessageBubble({ message, onDelete }) {
  const { user } = useAuth();
  const isOwn = message.sender?._id === user?.id;

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex items-end gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
          {message.sender?.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-xs font-semibold">
              {message.sender?.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-xs lg:max-w-md group relative`}>
        {!isOwn && (
          <p className="text-gray-400 text-xs mb-1 ml-1">@{message.sender?.username}</p>
        )}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-gray-800 text-gray-100 rounded-bl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        </div>
        <p className={`text-gray-500 text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatTime(message.createdAt)}
        </p>

        {/* Delete button — only for own messages */}
        {isOwn && (
          <button
            onClick={() => onDelete(message._id)}
            className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center hover:bg-red-600"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}