import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="text-white font-bold text-lg">ChatApp</span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/profile"
          className="flex items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded-lg transition"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-gray-300 text-sm font-medium">{user?.name}</span>
        </Link>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg text-sm transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}