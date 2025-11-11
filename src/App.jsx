import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import useNotificationStore from './store/notificationStore';
import socketService from './utils/socket';
import { requestNotificationPermission } from './utils/browserNotifications';
import api from './utils/api';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import PostsPage from './pages/PostsPage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import SocketTestPage from './pages/SocketTestPage';
import SocketListeners from './components/SocketListeners';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { darkMode, setDarkMode } = useThemeStore();
  const { setUnreadCount } = useNotificationStore();

  useEffect(() => {
    // Initialize dark mode
    setDarkMode(darkMode);
    
    // Request notification permission when app loads
    if (isAuthenticated) {
      requestNotificationPermission();
      
      // Fetch initial notification count
      api.get('/notifications')
        .then(({ data }) => {
          const notifs = data.notifications || data;
          const unreadCount = Array.isArray(notifs) 
            ? notifs.filter(n => !n.read).length 
            : 0;
          setUnreadCount(unreadCount);
        })
        .catch(err => {
          console.error('Failed to fetch initial notification count:', err);
        });
    }
  }, [isAuthenticated, darkMode, setDarkMode, setUnreadCount]);

  useEffect(() => {
    // Always connect socket on app mount so client is ready even if auth happens later
    try {
      // If user already exists on mount, pass user._id to let the socket emit user:join during connect
      socketService.connect(user?._id);
    } catch (error) {
      if (import.meta.env.VITE_CHAT_DEBUG) console.error('Socket connection error on mount:', error);
    }

    // Cleanup: In React Strict Mode (dev), components mount/unmount twice.
    // We don't want to fully disconnect the socket on every unmount.
    // Only disconnect if the component is truly being destroyed (e.g., app closing).
    // For now, do nothing on cleanup to allow socket to persist.
    return () => {
      // Don't disconnect socket here - let it persist across remounts
      if (import.meta.env.VITE_CHAT_DEBUG) console.debug('App cleanup: keeping socket connected');
    };
  }, []);

  // Emit user:join and wire user-specific socket listeners when the authenticated user becomes available
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Emit join event with user id
    try {
      socketService.emit('user:join', user._id);
    } catch (e) {
      console.error('Failed to emit user:join', e);
    }

    // Listen for realtime user updates targeted at this user
    const handleUserUpdated = (updatedUser) => {
      try {
        console.log('🔔 Received user:updated event:', updatedUser);
        
        if (updatedUser && updatedUser._id && updatedUser._id.toString() === user._id.toString()) {
          console.log('✅ User IDs match, updating store...');
          
          const patch = {
            reputation: updatedUser.reputation,
            completedHelps: updatedUser.completedHelps,
            trustBadge: updatedUser.trustBadge,
            averageRating: updatedUser.averageRating,
            totalRatings: updatedUser.totalRatings,
          };
          
          console.log('📊 Updating user with:', patch);
          
          import('./store/authStore').then((m) => {
            const updateUser = m.default.getState().updateUser;
            if (typeof updateUser === 'function') {
              updateUser(patch);
              console.log('✅ User store updated successfully!');
            } else {
              console.error('❌ updateUser function not found in store');
            }
          }).catch((e) => console.error('❌ Failed to update auth store from socket event', e));
        } else {
          console.log('⚠️ User IDs do not match or missing data:', {
            receivedId: updatedUser?._id,
            currentUserId: user._id,
          });
        }
      } catch (e) {
        console.error('❌ Error handling user:updated event', e);
      }
    };

    socketService.on('user:updated', handleUserUpdated);

    return () => {
      socketService.off('user:updated', handleUserUpdated);
    };
  }, [isAuthenticated, user]);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/signup"
        element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" replace />}
      />
      <Route path="/auth/success" element={<AuthSuccessPage />} />

      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
  {/* Global socket listeners (real-time updates) */}
  <Route path="*" element={<SocketListeners user={user} />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="posts/:id" element={<PostDetailPage />} />
        <Route path="posts/:id/edit" element={<EditPostPage />} />
        <Route path="posts/create" element={<CreatePostPage />} />
        <Route path="create-post" element={<CreatePostPage />} />
        
        {/* Settings route BEFORE profile/:userId to avoid conflicts */}
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Profile routes */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:userId" element={<ProfilePage />} />
        
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:chatId" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
  {/* Wallpaper test route removed */}
        <Route path="socket-test" element={<SocketTestPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
