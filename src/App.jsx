import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import socketService from './utils/socket';
import { requestNotificationPermission } from './utils/browserNotifications';

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
import WallpaperTestPage from './pages/WallpaperTestPage';
import SocketTestPage from './pages/SocketTestPage';

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

  useEffect(() => {
    // Initialize dark mode
    setDarkMode(darkMode);
    
    // Request notification permission when app loads
    if (isAuthenticated) {
      requestNotificationPermission();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Connect socket if authenticated
    if (isAuthenticated && user) {
      try {
        socketService.connect(user._id);
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    }

    return () => {
      if (isAuthenticated) {
        try {
          socketService.disconnect();
        } catch (error) {
          console.error('Socket disconnect error:', error);
        }
      }
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
        <Route path="wallpaper-test" element={<WallpaperTestPage />} />
        <Route path="socket-test" element={<SocketTestPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
