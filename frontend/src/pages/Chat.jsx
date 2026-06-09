import Navbar from '../components/Navbar';
import OnlineUsers from '../components/OnlineUsers';
import ChatWindow from '../components/ChatWindow';

export default function Chat() {
  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <OnlineUsers />
        <ChatWindow />
      </div>
    </div>
  );
}