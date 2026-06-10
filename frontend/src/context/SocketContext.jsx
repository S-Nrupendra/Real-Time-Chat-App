import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setOnlineUsers([]);
      }
      return;
    }

    // Fetch current online users from DB on connect
    const fetchOnlineUsers = async () => {
      try {
        const res = await api.get('/api/users/online');
        setOnlineUsers(res.data.users.map(u => ({
          userId: u._id,
          username: u.username,
          name: u.name,
          avatar: u.avatar
        })));
      } catch (err) {
        console.error('Failed to fetch online users:', err);
      }
    };

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      fetchOnlineUsers();
    });

    newSocket.on('user_online', (user) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.userId === user.userId);
        if (exists) return prev;
        return [...prev, user];
      });
    });

    newSocket.on('user_offline', (data) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, setOnlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);