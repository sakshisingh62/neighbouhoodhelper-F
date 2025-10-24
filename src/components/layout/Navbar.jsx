import { Link, useNavigate } from 'react-router-dom';
import { Menu } from '@headlessui/react';
import {
  Home,
  PlusCircle,
  MessageCircle,
  Bell,
  User,
  LogOut,
  Moon,
  Sun,
  Search,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import useNotificationStore from '../../store/notificationStore';
import useChatStore from '../../store/chatStore';
import { getAvatarUrl } from '../../utils/avatarHelper';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { unreadCount: notificationCount } = useNotificationStore();
  const { unreadCount: chatCount } = useChatStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">NH</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
              Neighborhood Helper
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              <Home size={20} />
              <span>Home</span>
            </Link>

            <Link
              to="/posts"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              <Search size={20} />
              <span>Browse</span>
            </Link>

            <Link
              to="/posts/create"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              <PlusCircle size={20} />
              <span>Post</span>
            </Link>

            <Link
              to="/chat"
              className="relative flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              <MessageCircle size={20} />
              <span>Chat</span>
              {chatCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {chatCount > 9 ? '9+' : chatCount}
                </span>
              )}
            </Link>

            <Link
              to="/notifications"
              className="relative flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <img
                  src={getAvatarUrl(user?.avatar)}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="hidden sm:inline text-gray-900 dark:text-white font-medium">
                  {user?.name}
                </span>
              </Menu.Button>

              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to={`/profile/${user?._id}`}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      } flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      } flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 w-full text-left`}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-gray-200 dark:border-gray-700">
          <Link to="/" className="p-2 text-gray-700 dark:text-gray-300">
            <Home size={24} />
          </Link>
          <Link to="/posts" className="p-2 text-gray-700 dark:text-gray-300">
            <Search size={24} />
          </Link>
          <Link to="/posts/create" className="p-2 text-gray-700 dark:text-gray-300">
            <PlusCircle size={24} />
          </Link>
          <Link to="/chat" className="p-2 relative text-gray-700 dark:text-gray-300">
            <MessageCircle size={24} />
            {chatCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {chatCount > 9 ? '9+' : chatCount}
              </span>
            )}
          </Link>
          <Link to="/notifications" className="p-2 relative text-gray-700 dark:text-gray-300">
            <Bell size={24} />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
