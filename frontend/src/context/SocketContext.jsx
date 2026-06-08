import { createContext, useContext, useEffect, useState } from "react";
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if(!token){
            if(socket){
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
            auth: { token }
        });

        newSocket.on('user_online', (user) => {
            setOnlineUsers(prev => {
                const exists = prev.find(u => u.userId === user.userId);
                if(exists) return prev;
                return [...prev, user];
            });
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