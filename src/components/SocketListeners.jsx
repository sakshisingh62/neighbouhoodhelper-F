import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socketService from '../utils/socket';
import useNotificationStore from '../store/notificationStore';
import { notifyNewMessage } from '../utils/browserNotifications';
import toast from 'react-hot-toast';

const SocketListeners = ({ user }) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!user) return;

    const handlePostUpdated = (post) => {
      try {
        // Update single post cache if present
        queryClient.setQueryData(['post', post._id], (old) => ({ ...old, ...post }));

        // Invalidate posts list so pages show latest status
        queryClient.invalidateQueries(['posts']);
      } catch (e) {
        console.error('Error handling post:updated', e);
      }
    };

    const handleNotificationReceived = (notification) => {
      try {
        console.log('📬 New notification received:', notification);
        
        // Add to notification store (updates badge count)
        addNotification(notification);
        
        // Invalidate notifications query to refresh the list
        queryClient.invalidateQueries(['notifications']);
        
        // Show browser notification if tab is not focused
        if (document.hidden) {
          const title = notification.title || 'New Notification';
          const body = notification.message || notification.content || '';
          notifyNewMessage(title, body, notification._id);
        }
        
        // Show toast notification
        toast.success(notification.message || 'You have a new notification', {
          icon: '🔔',
          duration: 3000,
        });
      } catch (e) {
        console.error('Error handling notification:new', e);
      }
    };

    socketService.on('post:updated', handlePostUpdated);
    socketService.on('notification:new', handleNotificationReceived);

    return () => {
      socketService.off('post:updated', handlePostUpdated);
      socketService.off('notification:new', handleNotificationReceived);
    };
  }, [user, queryClient, addNotification]);

  return null;
};

export default SocketListeners;
