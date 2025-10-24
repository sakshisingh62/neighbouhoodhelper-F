import { useState, useEffect } from 'react';
import socketService from '../utils/socket';
import useAuthStore from '../store/authStore';
import { Activity, Send, Wifi, WifiOff, Users, MessageCircle, Bell, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const SocketTestPage = () => {
  const { user } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [testMessage, setTestMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [typingStatus, setTypingStatus] = useState('');
  const [testReceiverId, setTestReceiverId] = useState('');

  // Add event to log
  const addEvent = (type, message, data = null) => {
    const event = {
      type,
      message,
      data,
      timestamp: new Date().toLocaleTimeString(),
    };
    setEvents((prev) => [event, ...prev].slice(0, 20)); // Keep last 20 events
  };

  useEffect(() => {
    // Connect socket
    socketService.connect(user._id);
    addEvent('info', '🔌 Connecting to socket...', { userId: user._id });

    // Listen for connection
    socketService.on('connect', () => {
      setConnected(true);
      addEvent('success', '✅ Socket connected!', { socketId: socketService.socket?.id });
      toast.success('Socket Connected!');
    });

    // Listen for disconnect
    socketService.on('disconnect', () => {
      setConnected(false);
      addEvent('error', '❌ Socket disconnected!');
      toast.error('Socket Disconnected!');
    });

    // Listen for online users
    socketService.on('users:online', (users) => {
      setOnlineUsers(users);
      addEvent('info', `👥 Online users updated: ${users.length}`, { users });
    });

    // Listen for incoming messages
    socketService.on('message:receive', (message) => {
      setReceivedMessages((prev) => [...prev, message]);
      addEvent('success', '📨 Message received!', message);
      toast.success('New message received!');
    });

    // Listen for typing status
    socketService.on('typing:status', ({ userId, isTyping }) => {
      if (isTyping) {
        setTypingStatus(`User ${userId} is typing...`);
        addEvent('info', '⌨️ User is typing...', { userId });
      } else {
        setTypingStatus('');
      }
    });

    // Listen for notifications
    socketService.on('notification:receive', (notification) => {
      addEvent('success', '🔔 Notification received!', notification);
      toast.success('New notification!');
    });

    // Listen for read receipts
    socketService.on('message:read:confirm', ({ chatId }) => {
      addEvent('info', '✓✓ Message read', { chatId });
    });

    // Cleanup
    return () => {
      socketService.off('connect');
      socketService.off('disconnect');
      socketService.off('users:online');
      socketService.off('message:receive');
      socketService.off('typing:status');
      socketService.off('notification:receive');
      socketService.off('message:read:confirm');
    };
  }, [user._id]);

  // Send test message
  const handleSendMessage = () => {
    if (!testMessage.trim() || !testReceiverId.trim()) {
      toast.error('Please enter receiver ID and message!');
      return;
    }

    const messageData = {
      senderId: user._id,
      receiverId: testReceiverId,
      content: testMessage,
      timestamp: new Date(),
    };

    socketService.emit('message:send', {
      receiverId: testReceiverId,
      message: messageData,
    });

    addEvent('send', '📤 Message sent!', messageData);
    toast.success('Message sent!');
    setTestMessage('');
  };

  // Send typing indicator
  const handleTyping = (e) => {
    setTestMessage(e.target.value);
    
    if (testReceiverId.trim()) {
      socketService.emit('typing:start', {
        receiverId: testReceiverId,
        chatId: 'test-chat',
      });

      // Auto-stop after 1 second
      setTimeout(() => {
        socketService.emit('typing:stop', {
          receiverId: testReceiverId,
          chatId: 'test-chat',
        });
      }, 1000);
    }
  };

  // Emit test notification
  const sendTestNotification = () => {
    if (!testReceiverId.trim()) {
      toast.error('Please enter receiver ID!');
      return;
    }

    const notification = {
      type: 'test',
      message: 'This is a test notification',
      timestamp: new Date(),
    };

    socketService.emit('notification:new', {
      userId: testReceiverId,
      notification,
    });

    addEvent('send', '🔔 Notification sent!', notification);
    toast.success('Notification sent!');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🔌 Socket.io Test Page
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time testing for Socket.io connection and events
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  connected
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {connected ? <Wifi size={20} /> : <WifiOff size={20} />}
                <span className="font-semibold">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg flex items-center gap-2">
                <Users size={20} />
                <span className="font-semibold">{onlineUsers.length} Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Connection Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="text-primary-600" />
                Connection Info
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Your User ID:
                  </span>
                  <p className="text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                    {user._id}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Socket ID:
                  </span>
                  <p className="text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded mt-1">
                    {socketService.socket?.id || 'Not connected'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <p
                    className={`font-semibold mt-1 ${
                      connected ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {connected ? '✅ Active' : '❌ Inactive'}
                  </p>
                </div>
              </div>
            </div>

            {/* Send Message */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageCircle className="text-primary-600" />
                Send Test Message
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Receiver User ID:
                  </label>
                  <input
                    type="text"
                    value={testReceiverId}
                    onChange={(e) => setTestReceiverId(e.target.value)}
                    placeholder="Enter receiver's user ID"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Open this page in another browser/incognito with different user
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message:
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    rows="3"
                  />
                  {typingStatus && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                      {typingStatus}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!connected}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Send size={18} />
                  Send Message
                </button>
              </div>
            </div>

            {/* Other Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="text-primary-600" />
                Other Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={sendTestNotification}
                  disabled={!connected}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Send Test Notification
                </button>
                <button
                  onClick={() => {
                    setEvents([]);
                    toast.success('Event log cleared!');
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Clear Event Log
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Logs */}
          <div className="space-y-6">
            {/* Received Messages */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="text-primary-600" />
                Received Messages ({receivedMessages.length})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {receivedMessages.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No messages received yet
                  </p>
                ) : (
                  receivedMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        From: <span className="font-mono">{msg.senderId}</span>
                      </p>
                      <p className="text-gray-900 dark:text-white mt-1">{msg.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Event Log */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                📊 Event Log (Last 20)
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No events logged yet
                  </p>
                ) : (
                  events.map((event, idx) => (
                    <div
                      key={idx}
                      className={`border-l-4 p-3 rounded ${
                        event.type === 'success'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : event.type === 'error'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : event.type === 'send'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.message}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                          {event.timestamp}
                        </span>
                      </div>
                      {event.data && (
                        <pre className="text-xs text-gray-600 dark:text-gray-400 mt-2 overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Online Users */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="text-primary-600" />
                Online Users ({onlineUsers.length})
              </h2>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {onlineUsers.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No online users
                  </p>
                ) : (
                  onlineUsers.map((userId) => (
                    <div
                      key={userId}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {userId}
                      </span>
                      {userId === user._id && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-3">
            📝 How to Test:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700 dark:text-yellow-300">
            <li>Open this page in another browser tab or incognito window</li>
            <li>Login with a different account</li>
            <li>Copy the User ID from Connection Info section</li>
            <li>Paste it in "Receiver User ID" field on this page</li>
            <li>Type a message and click "Send Message"</li>
            <li>Check the "Received Messages" section on the other browser</li>
            <li>Watch the Event Log for real-time updates</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SocketTestPage;
