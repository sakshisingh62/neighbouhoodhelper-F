import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  User,
  AlertCircle,
  Loader,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Navigation
} from 'lucide-react';
import api from '../utils/api';
import { calculateDistance, formatDistance } from '../utils/distance';

const PostsPage = () => {
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    urgency: '',
    status: 'active',
    search: '',
  });
  const [userLocation, setUserLocation] = useState(null);

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  // Fetch posts with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/posts?${params.toString()}`);
      return data;
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: <CheckCircle size={14} />, text: 'Active' },
      'in-progress': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: <Clock size={14} />, text: 'In Progress' },
      completed: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: <CheckCircle size={14} />, text: 'Completed' },
      expired: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: <XCircle size={14} />, text: 'Expired' },
      cancelled: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: <XCircle size={14} />, text: 'Cancelled' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Posts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find help requests or offer your assistance
          </p>
        </div>
        <Link to="/create-post" className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Create Post
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => handleFilterChange('status', '')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filters.status === ''
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => handleFilterChange('status', 'active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            filters.status === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <CheckCircle size={18} />
          Active
        </button>
        <button
          onClick={() => handleFilterChange('status', 'in-progress')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            filters.status === 'in-progress'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Clock size={18} />
          In Progress
        </button>
        <button
          onClick={() => handleFilterChange('status', 'completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            filters.status === 'completed'
              ? 'bg-gray-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <CheckCircle size={18} />
          Completed
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search posts..."
              className="input pl-10"
            />
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="input"
          >
            <option value="">All Types</option>
            <option value="help">Need Help</option>
            <option value="offer">Offering Help</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input"
          >
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="moving">Moving & Transport</option>
            <option value="repairs">Repairs & Maintenance</option>
            <option value="shopping">Shopping & Errands</option>
            <option value="tutoring">Tutoring & Learning</option>
            <option value="technology">Technology Help</option>
            <option value="gardening">Gardening & Plants</option>
            <option value="pets">Pet Care</option>
            <option value="food">Food & Cooking</option>
            <option value="other">Other</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={filters.urgency}
            onChange={(e) => handleFilterChange('urgency', e.target.value)}
            className="input"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin text-primary-600" size={40} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Posts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {error.message || 'Something went wrong'}
            </p>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {!isLoading && !error && data && (
        <>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {data.posts?.length || 0} of {data.total || 0} posts
          </div>

          {data.posts && data.posts.length === 0 ? (
            <div className="card">
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Posts Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your filters or create a new post
                </p>
                <Link to="/create-post" className="btn btn-primary">
                  Create First Post
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.posts?.map((post) => (
                <Link
                  key={post._id}
                  to={`/posts/${post._id}`}
                  className={`card hover:shadow-lg transition-shadow relative ${post.status === 'completed' ? 'opacity-60 grayscale pointer-events-auto' : ''}`}
                >
                  {/* Completed Banner */}
                  {post.status === 'completed' && (
                    <div className="absolute top-0 left-0 w-full flex justify-center z-10">
                      <span className="bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg flex items-center gap-2 shadow-lg mt-0">
                        <CheckCircle size={16} className="inline-block" />
                        Task Completed
                      </span>
                    </div>
                  )}
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 mt-2">
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
                        post.urgency === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : post.urgency === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}
                    >
                      {post.urgency}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    {getStatusBadge(post.status)}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span className="truncate">{post.userId?.name}</span>
                    </div>
                    {post.location && (
                      <>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span className="truncate">
                            {post.location.area || post.location}
                          </span>
                        </div>
                        {/* Distance indicator */}
                        {userLocation && post.location?.coordinates && (
                          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                            <Navigation size={14} />
                            <span className="font-medium">
                              {formatDistance(
                                calculateDistance(
                                  userLocation.latitude,
                                  userLocation.longitude,
                                  post.location.coordinates[1],
                                  post.location.coordinates[0]
                                )
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostsPage;
