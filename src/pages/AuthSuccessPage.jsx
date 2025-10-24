import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (!token) {
        toast.error('No authentication token received.');
        navigate('/login');
        return;
      }

      try {
        // Set the token in localStorage
        localStorage.setItem('token', token);

        // Fetch user data
        const response = await api.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Update auth store
        setAuth(response.data, token);

        toast.success('Successfully logged in with Google!');
        navigate('/');
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Failed to complete authentication.');
        navigate('/login');
      }
    };

    handleAuthSuccess();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4 animate-pulse">
          <span className="text-white font-bold text-2xl">NH</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Completing Sign In...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we log you in
        </p>
      </div>
    </div>
  );
};

export default AuthSuccessPage;
