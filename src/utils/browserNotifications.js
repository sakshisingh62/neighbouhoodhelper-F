// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show browser notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/logo.png', // Add your app logo
      badge: '/badge.png', // Add your badge icon
      vibrate: [200, 100, 200],
      ...options,
    });

    notification.onclick = function (event) {
      event.preventDefault();
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };

    return notification;
  }
  return null;
};

// Notification for new message
export const notifyNewMessage = (senderName, messageContent, chatId) => {
  showNotification(`New message from ${senderName}`, {
    body: messageContent || 'Sent an image',
    tag: `chat-${chatId}`,
    icon: '/message-icon.png',
    onClick: () => {
      window.location.href = `/chat/${chatId}`;
    },
  });
};

// Notification for new post
export const notifyNewPost = (title, description) => {
  showNotification('New Help Request Nearby', {
    body: `${title}\n${description.substring(0, 100)}...`,
    tag: 'new-post',
    icon: '/post-icon.png',
  });
};

// Notification for post update
export const notifyPostUpdate = (title, status) => {
  showNotification('Post Status Updated', {
    body: `"${title}" is now ${status}`,
    tag: 'post-update',
  });
};

// Notification for new rating
export const notifyNewRating = (rating, review) => {
  const stars = '⭐'.repeat(rating);
  showNotification('You received a new rating!', {
    body: `${stars}\n${review || 'No review provided'}`,
    tag: 'new-rating',
  });
};
