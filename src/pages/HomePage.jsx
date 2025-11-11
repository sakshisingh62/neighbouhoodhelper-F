import { Link } from 'react-router-dom';
import { Users, MessageCircle, Shield } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useEffect } from 'react';
import socketService from '../utils/socket';
import api from '../utils/api';

const HomePage = () => {
  const { user, updateUser } = useAuthStore();

  // Fetch fresh user data on component mount
  useEffect(() => {
    const fetchFreshUserData = async () => {
      if (!user) return;
      
      try {
        console.log('🔄 HomePage: Fetching fresh user data from API');
        const { data } = await api.get('/auth/me');
        console.log('✅ HomePage: Fresh data received:', data);
        
        // Update authStore with fresh data
        updateUser({
          reputation: data.reputation,
          completedHelps: data.completedHelps,
          trustBadge: data.trustBadge,
          averageRating: data.averageRating,
          totalRatings: data.totalRatings,
        });
      } catch (error) {
        console.error('❌ HomePage: Error fetching fresh user data:', error);
      }
    };

    fetchFreshUserData();
  }, []); // Run only once on mount

  // Listen for user updates via socket (for real-time stats update)
  useEffect(() => {
    if (!user) return;

    const handleUserUpdated = (updatedUser) => {
      console.log('🏠 HomePage: Received user:updated event:', updatedUser);
      
      if (updatedUser && updatedUser._id && updatedUser._id.toString() === user._id.toString()) {
        console.log('✅ HomePage: Updating user stats in real-time');
        
        // Update store which will trigger re-render
        updateUser({
          reputation: updatedUser.reputation,
          completedHelps: updatedUser.completedHelps,
          trustBadge: updatedUser.trustBadge,
          averageRating: updatedUser.averageRating,
          totalRatings: updatedUser.totalRatings,
        });
      }
    };

    socketService.on('user:updated', handleUserUpdated);

    return () => {
      socketService.off('user:updated', handleUserUpdated);
    };
  }, [user, updateUser]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <h1 className="text-4xl font-bold mb-4">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-xl mb-6">
          Ready to help your community or find the assistance you need?
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/posts/create" className="btn bg-white text-primary-600 hover:bg-gray-100">
            Post a Request
          </Link>
          <Link to="/posts" className="btn btn-outline border-white text-white hover:bg-white/10">
            Browse Posts
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full mb-3">
            {/* <HandHeart className="text-primary-600 dark:text-primary-400" size={24} /> */}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.reputation || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Reputation Points</div>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mb-3">
            <Users className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.completedHelps || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed Helps</div>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-3">
            <Shield className="text-yellow-600 dark:text-yellow-400" size={24} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.trustBadge?.toUpperCase() || 'NONE'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Trust Badge</div>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full mb-3">
            <MessageCircle className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ⭐ {user?.averageRating?.toFixed(1) || '0.0'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/posts?type=need"
            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition group"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600">
              Find Help Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Browse requests from people who need your assistance
            </p>
          </Link>

          <Link
            to="/posts?type=offer"
            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition group"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600">
              Find Offers
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              See what others are offering to share or provide
            </p>
          </Link>

          <Link
            to="/chat"
            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition group"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600">
              My Chats
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Continue conversations with your neighbors
            </p>
          </Link>

          <Link
            to={`/profile/${user?._id}`}
            className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition group"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600">
              My Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              View and edit your profile information
            </p>
          </Link>
        </div>
      </div>

      {/* Community Tips */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">
          💡 Community Tips
        </h2>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200">
          <li>• Be clear and specific in your posts</li>
          <li>• Respond promptly to messages</li>
          <li>• Rate helpers after completing a request</li>
          <li>• Build your reputation by helping others</li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;
