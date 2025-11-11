import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SocketListeners from '../SocketListeners';
import useAuthStore from '../../store/authStore';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <SocketListeners user={useAuthStore().user} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
