import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  MessageCircle,
  Heart,
  UserPlus,
  MessageSquare,
  Star,
  AlertCircle,
  Loader,
  Filter,
  Clock,
  X
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const NotificationsPage = () => {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data.notifications || data; // Handle both response formats
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const { data } = await api.put(`/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/notifications/mark-all-read');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      const { data } = await api.delete(`/notifications/${notificationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification deleted');
    },
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/notifications/clear-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications cleared');
    },
  });

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId, e) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAllMutation.mutate();
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="text-blue-500" size={24} />;
      case 'like':
        return <Heart className="text-red-500" size={24} />;
      case 'follow':
        return <UserPlus className="text-green-500" size={24} />;
      case 'comment':
        return <MessageSquare className="text-purple-500" size={24} />;
      case 'rating':
        return <Star className="text-yellow-500" size={24} />;
      case 'post':
        return <Bell className="text-orange-500" size={24} />;
      default:
        return <Bell className="text-gray-500" size={24} />;
    }
  };

  // Filter notifications
  const filteredNotifications = notifications?.filter((notification) => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn btn-secondary flex items-center gap-2"
              disabled={markAllAsReadMutation.isLoading}
            >
              <CheckCheck size={18} />
              Mark all read
            </button>
          )}
          {notifications && notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-outline flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              disabled={clearAllMutation.isLoading}
            >
              <Trash2 size={18} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All ({notifications?.length || 0})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Bell size={18} />
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            filter === 'read'
              ? 'bg-gray-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <CheckCheck size={18} />
          Read ({(notifications?.length || 0) - unreadCount})
        </button>
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
              Failed to Load Notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {error.message || 'Something went wrong'}
            </p>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && !error && (
        <div className="space-y-2">
          {filteredNotifications && filteredNotifications.length === 0 ? (
            <div className="card">
              <div className="text-center py-12">
                <BellOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {filter === 'unread' ? 'No Unread Notifications' : filter === 'read' ? 'No Read Notifications' : 'No Notifications'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'unread' 
                    ? "You're all caught up!"
                    : filter === 'read'
                    ? "You haven't read any notifications yet"
                    : "You'll see notifications here when you get them"}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications?.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                className={`card cursor-pointer transition-all hover:shadow-md ${
                  !notification.read 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                      )}
                    </div>
                    
                    {notification.content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {notification.content}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                      
                      {notification.read && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Check size={12} />
                          <span>Read</span>
                        </div>
                      )}
                    </div>

                    {/* Link if available */}
                    {notification.link && (
                      <Link
                        to={notification.link}
                        className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(notification._id, e)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    disabled={deleteNotificationMutation.isLoading}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
