import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  MessageCircle,
  Star,
  AlertCircle,
  Clock,
  Tag,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { getAvatarUrl } from '../utils/avatarHelper';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch post details
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`);
      return data;
    },
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      toast.success('Post deleted successfully!');
      queryClient.invalidateQueries(['posts']);
      navigate('/posts');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    },
  });

  // Mark interest mutation
  const interestMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/posts/${id}/interest`);
    },
    onSuccess: () => {
      toast.success('Interest marked!');
      queryClient.invalidateQueries(['post', id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark interest');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
  };

  const handleInterest = () => {
    if (!user) {
      toast.error('Please login to show interest');
      navigate('/login');
      return;
    }
    interestMutation.mutate();
  };

  const handleContact = () => {
    if (!user) {
      toast.error('Please login to contact');
      navigate('/login');
      return;
    }
    navigate(`/chat?userId=${post.userId._id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Post Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <button onClick={() => navigate('/posts')} className="btn btn-primary">
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isOwner = user?._id === post.userId._id;
  const urgencyColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  const statusColors = {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      {/* Main Card */}
      <div className="card">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  post.type === 'help' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                }`}
              >
                {post.type === 'help' ? '🆘 Need Help' : '💝 Offering Help'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[post.status]}`}>
                {post.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${urgencyColors[post.urgency]}`}>
                {post.urgency} priority
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {post.title}
            </h1>
          </div>

          {/* Action Buttons for Owner */}
          {isOwner && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => navigate(`/posts/${id}/edit`)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                title="Edit post"
              >
                <Edit size={20} />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Delete post"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{new Date(post.createdAt).toLocaleTimeString()}</span>
          </div>
          {post.location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span>{post.location.area || post.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Tag size={16} />
            <span className="capitalize">{post.category}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Description
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {post.description}
          </p>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location Details */}
        {post.location?.coordinates?.lat && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" />
              Location
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {post.location.area || 'Location provided'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              📍 {post.location.coordinates.lat.toFixed(6)}, {post.location.coordinates.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Author Information */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Posted By
          </h3>
          <div className="flex items-center gap-4">
            <img
              src={getAvatarUrl(post.userId.avatar)}
              alt={post.userId.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {post.userId.name}
                </h4>
                {post.userId.verified && (
                  <CheckCircle size={16} className="text-blue-600" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span>{post.userId.reputation || 0} reputation</span>
              </div>
              {post.userId.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {post.userId.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwner && post.status === 'active' && (
          <div className="flex gap-4">
            <button
              onClick={handleInterest}
              disabled={interestMutation.isPending}
              className="btn btn-primary flex-1"
            >
              <AlertCircle size={18} className="mr-2" />
              {interestMutation.isPending ? 'Processing...' : 'Show Interest'}
            </button>
            <button
              onClick={handleContact}
              className="btn btn-outline flex-1"
            >
              <MessageCircle size={18} className="mr-2" />
              Contact
            </button>
          </div>
        )}

        {/* Interested Users */}
        {post.interestedUsers && post.interestedUsers.length > 0 && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Interested Users ({post.interestedUsers.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {post.interestedUsers.map((interestedUser) => (
                <div
                  key={interestedUser._id}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg"
                >
                  <img
                    src={getAvatarUrl(interestedUser.avatar)}
                    alt={interestedUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {interestedUser.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
                  Delete Post
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this post? All associated data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetailPage;
