import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User,
  MapPin,
  Mail,
  Star,
  Award,
  Calendar,
  Edit,
  Settings,
  CheckCircle,
  MessageCircle,
  FileText,
  TrendingUp,
  Shield,
  Upload,
  Loader,
} from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { getAvatarUrl } from '../utils/avatarHelper';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('posts');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.put('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: (data) => {
      console.log('Upload success:', data);
      // Update the user in auth store
      if (data.avatar) {
        updateUser({ avatar: data.avatar });
      }
      queryClient.invalidateQueries(['user-profile']);
      queryClient.invalidateQueries(['auth']);
      setUploading(false);
      alert('Photo uploaded successfully!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      alert(error.response?.data?.message || 'Failed to upload photo');
      setUploading(false);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setUploading(true);
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleEditPhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Fetch user's posts
  const { data: postsData } = useQuery({
    queryKey: ['user-posts', user?._id],
    queryFn: async () => {
      const { data } = await api.get(`/posts?userId=${user._id}`);
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's full profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile', user?._id],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Not Logged In
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please login to view your profile
          </p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const profile = profileData || user;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header Card */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={getAvatarUrl(profile.avatar)}
                alt={profile.name}
                className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-lg object-cover"
              />
              {profile.verified && (
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2">
                  <CheckCircle className="text-white" size={20} />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={handleEditPhotoClick}
              disabled={uploading}
              className="mt-4 btn btn-outline text-sm"
            >
              {uploading ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Edit size={16} className="mr-2" />
                  Edit Photo
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {profile.name}
                  </h1>
                  {profile.verified && (
                    <CheckCircle className="text-blue-600" size={24} />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 capitalize">
                  {profile.role || 'Member'}
                </p>
              </div>
              <Link to="/settings" className="btn btn-outline">
                <Settings size={18} className="mr-2" />
                Settings
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-500 mb-1">
                  <Star size={20} className="fill-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.reputation || 0}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reputation</p>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                  <CheckCircle size={20} />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.completedHelps || 0}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
                  <Award size={20} />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {profile.trustBadge || 'None'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Badge</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail size={18} />
                <span>{profile.email}</span>
              </div>
              {profile.location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={18} />
                  <span>
                    {profile.location.campus && `${profile.location.campus}, `}
                    {profile.location.building || 'No location set'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar size={18} />
                <span>Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'posts'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <FileText size={18} className="inline mr-2" />
            My Posts ({postsData?.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'activity'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <TrendingUp size={18} className="inline mr-2" />
            Activity
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'ratings'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Star size={18} className="inline mr-2" />
            Ratings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div>
          {postsData && postsData.posts && postsData.posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {postsData.posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/posts/${post._id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        post.type === 'help'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}
                    >
                      {post.type === 'help' ? '🆘 Need Help' : '💝 Offer'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        post.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : post.status === 'completed'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span className="capitalize">{post.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Posts Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first post to get started
                </p>
                <Link to="/create-post" className="btn btn-primary">
                  Create Post
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Activity History
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your recent activity will appear here
            </p>
          </div>
        </div>
      )}

      {activeTab === 'ratings' && (
        <div className="space-y-6">
          {/* Reputation Breakdown Card */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="text-primary-600" size={24} />
              Reputation Points Breakdown
            </h3>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current: {profile.reputation || 0} points
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {profile.trustBadge === 'gold' ? '🏆 Gold Badge' : 
                   profile.trustBadge === 'silver' ? '🥈 Silver Badge' :
                   profile.trustBadge === 'bronze' ? '🥉 Bronze Badge' : 
                   profile.reputation >= 100 ? 'Next: 🏆 Gold (100+)' :
                   profile.reputation >= 50 ? 'Next: 🏆 Gold at 100' :
                   profile.reputation >= 20 ? 'Next: 🥈 Silver at 50' :
                   'Next: 🥉 Bronze at 20'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    profile.reputation >= 100 ? 'bg-yellow-500' :
                    profile.reputation >= 50 ? 'bg-gray-400' :
                    profile.reputation >= 20 ? 'bg-orange-600' :
                    'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.min(
                      profile.reputation >= 100 ? 100 :
                      profile.reputation >= 50 ? ((profile.reputation - 50) / 50) * 100 :
                      profile.reputation >= 20 ? ((profile.reputation - 20) / 30) * 100 :
                      (profile.reputation / 20) * 100,
                      100
                    )}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Points Sources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="text-green-600" size={24} />
                  <span className="text-2xl font-bold text-green-600">
                    {(profile.completedHelps || 0) * 5}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Completed Helps
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profile.completedHelps || 0} helps × 5 points
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  +5 points per completed help
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-2">
                  <Star className="text-yellow-600 fill-yellow-600" size={24} />
                  <span className="text-2xl font-bold text-yellow-600">
                    {Math.round((profile.averageRating || 0) >= 4 ? 
                      (profile.ratingsReceived || 0) * 10 : 
                      (profile.ratingsReceived || 0) * 5)}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  High Ratings
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg: {profile.averageRating?.toFixed(1) || '0.0'} ⭐
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  +10 points for 4-5★, +5 for 3★
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <Award className="text-blue-600" size={24} />
                  <span className="text-2xl font-bold text-blue-600">
                    {profile.reputation || 0}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Total Reputation
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Overall community standing
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Keep helping to earn more!
                </p>
              </div>
            </div>

            {/* Badge Requirements */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Trust Badge Requirements
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-700">
                  <span className="flex items-center gap-2">
                    🥉 <span className="font-medium">Bronze Badge</span>
                  </span>
                  <span className={profile.reputation >= 20 ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                    20+ points {profile.reputation >= 20 && '✓'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-700">
                  <span className="flex items-center gap-2">
                    🥈 <span className="font-medium">Silver Badge</span>
                  </span>
                  <span className={profile.reputation >= 50 ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                    50+ points {profile.reputation >= 50 && '✓'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-700">
                  <span className="flex items-center gap-2">
                    🏆 <span className="font-medium">Gold Badge</span>
                  </span>
                  <span className={profile.reputation >= 100 ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                    100+ points {profile.reputation >= 100 && '✓'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ratings & Reviews Card */}
          <div className="card">
            <div className="text-center py-12">
              <Star className="mx-auto h-12 w-12 text-yellow-500 mb-4 fill-yellow-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ratings & Reviews
              </h3>
              <div className="mb-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.averageRating?.toFixed(1) || '0.0'} ⭐
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Based on {profile.ratingsReceived || 0} review{(profile.ratingsReceived || 0) !== 1 && 's'}
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Reviews from people you've helped will appear here
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
