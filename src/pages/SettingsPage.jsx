import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  MapPin,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Trash2,
  Link as LinkIcon,
  CheckCircle,
} from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

const SettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      campus: user?.location?.campus || '',
      building: user?.location?.building || '',
      role: user?.role || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const { data: response } = await api.put('/users/profile', {
        name: data.name,
        bio: data.bio,
        location: {
          campus: data.campus,
          building: data.building,
        },
        role: data.role,
      });
      return response;
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries(['user-profile']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data) => {
      await api.put('/users/password', data);
    },
    onSuccess: () => {
      toast.success('Password updated successfully!');
      resetPassword();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update password');
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/account');
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    },
  });

  // Disconnect Google mutation
  const disconnectGoogleMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/users/disconnect-google');
      return data;
    },
    onSuccess: () => {
      toast.success('Google account disconnected');
      queryClient.invalidateQueries(['user-profile']);
      queryClient.invalidateQueries(['auth']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to disconnect Google account');
    },
  });

  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
    setShowDeleteModal(false);
  };

  const handleDisconnectGoogle = () => {
    if (confirm('Are you sure you want to disconnect your Google account? You can still sign in with email/password.')) {
      disconnectGoogleMutation.mutate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Settings
      </h1>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <User size={18} className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'password'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Lock size={18} className="inline mr-2" />
            Password
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Bell size={18} className="inline mr-2" />
            Notifications
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Profile Information
          </h2>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  {...registerProfile('name', { required: 'Name is required' })}
                  className="input pl-10"
                  placeholder="Your name"
                />
              </div>
              {profileErrors.name && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  {...registerProfile('email')}
                  className="input pl-10 bg-gray-100 dark:bg-gray-700"
                  placeholder="your@email.com"
                  disabled
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select {...registerProfile('role')} className="input">
                <option value="student">Student</option>
                <option value="resident">Resident</option>
                <option value="staff">Staff</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campus
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    {...registerProfile('campus')}
                    className="input pl-10"
                    placeholder="Main Campus"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Building
                </label>
                <input
                  type="text"
                  {...registerProfile('building')}
                  className="input"
                  placeholder="Building A"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                {...registerProfile('bio')}
                rows={4}
                className="input resize-none"
                placeholder="Tell others about yourself..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn btn-primary w-full"
            >
              <Save size={18} className="mr-2" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Connected Accounts Section */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Connected Accounts
            </h3>
            <div className="space-y-4">
              {/* Google Account */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Google</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.googleId ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {user?.googleId ? (
                  <button
                    onClick={handleDisconnectGoogle}
                    disabled={disconnectGoogleMutation.isPending}
                    className="btn btn-outline text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {disconnectGoogleMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                    className="btn btn-outline text-sm"
                  >
                    <LinkIcon size={16} className="mr-2" />
                    Connect
                  </button>
                )}
              </div>
            </div>
            {user?.googleId && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                💡 You can sign in using your Google account or email/password
              </p>
            )}
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required',
                  })}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your password',
                  })}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="btn btn-primary w-full"
            >
              <Lock size={18} className="mr-2" />
              {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Notification Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">New Messages</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when you receive a new message
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Post Responses</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when someone responds to your post
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Post Interest</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when someone shows interest in your post
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive email updates for important activities
                </p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card border-2 border-red-200 dark:border-red-800 mt-6">
        <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-4">
          Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Logout</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign out from your account
              </p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline text-gray-700">
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-100">Delete Account</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 size={18} className="mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete your account? All your posts, messages,
              and data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
