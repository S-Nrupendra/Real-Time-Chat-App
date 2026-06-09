import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function OnlineUsers() {
  const { onlineUsers } = useSocket();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-800">
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          Online — {onlineUsers.length}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {onlineUsers.length === 0 ? (
          <p className="text-gray-500 text-sm px-4 py-3">No one else online</p>
        ) : (
          onlineUsers.map((u) => (
            <div
              key={u.userId}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition"
            >
              <div className="relative">
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {u.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div>
                <p className="text-gray-200 text-sm font-medium">{u.name}</p>
                <p className="text-gray-500 text-xs">@{u.username}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}