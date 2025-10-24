import { useState, useEffect } from 'react';
import socketService from '../utils/socket';
import useAuthStore from '../store/authStore';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const SocketDebugPanel = () => {
  const { user } = useAuthStore();
  const [status, setStatus] = useState({
    connected: false,
    socketId: null,
    userId: null,
    reconnecting: false,
    error: null,
  });

  useEffect(() => {
    const checkConnection = () => {
      const socket = socketService.getSocket();
      setStatus({
        connected: socket?.connected || false,
        socketId: socket?.id || null,
        userId: user?._id || null,
        reconnecting: false,
        error: null,
      });
    };

    // Initial check
    checkConnection();

    // Listen to socket events
    socketService.on('connect', () => {
      console.log('✅ Socket connected!');
      checkConnection();
      toast.success('Socket connected!');
    });

    socketService.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      checkConnection();
      toast.error('Socket disconnected!');
    });

    socketService.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setStatus(prev => ({ ...prev, error: error.message }));
      toast.error('Socket connection failed!');
    });

    socketService.on('reconnect_attempt', () => {
      console.log('🔄 Reconnecting...');
      setStatus(prev => ({ ...prev, reconnecting: true }));
    });

    // Check every 3 seconds
    const interval = setInterval(checkConnection, 3000);

    return () => {
      clearInterval(interval);
      socketService.off('connect');
      socketService.off('disconnect');
      socketService.off('connect_error');
      socketService.off('reconnect_attempt');
    };
  }, [user]);

  const handleReconnect = () => {
    toast.loading('Reconnecting...');
    socketService.disconnect();
    setTimeout(() => {
      socketService.connect(user._id);
      toast.dismiss();
    }, 1000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-4 min-w-[300px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🔌 Socket Status
          </h3>
          <button
            onClick={handleReconnect}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Reconnect"
          >
            <RefreshCw size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Connection:</span>
            <div className="flex items-center gap-2">
              {status.connected ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Connected
                  </span>
                </>
              ) : status.reconnecting ? (
                <>
                  <AlertCircle size={16} className="text-yellow-500 animate-pulse" />
                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    Reconnecting...
                  </span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-red-500" />
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Disconnected
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Socket ID */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Socket ID:</span>
            <span className="text-xs font-mono text-gray-900 dark:text-white">
              {status.socketId || 'N/A'}
            </span>
          </div>

          {/* User ID */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">User ID:</span>
            <span className="text-xs font-mono text-gray-900 dark:text-white truncate max-w-[150px]">
              {status.userId || 'N/A'}
            </span>
          </div>

          {/* Error */}
          {status.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{status.error}</p>
            </div>
          )}

          {/* Connection Indicator */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status.connected
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              ></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {status.connected ? 'Real-time active' : 'Real-time inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocketDebugPanel;
