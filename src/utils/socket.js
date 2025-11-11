import { io } from 'socket.io-client';

// Resolve SOCKET_URL with a sensible fallback: use VITE_SOCKET_URL, otherwise
// construct from current host + VITE_SOCKET_PORT (if provided) or default to 5000.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_SOCKET_PORT || 5000}`;

if (import.meta.env.VITE_CHAT_DEBUG) {
  console.debug('SocketService: using SOCKET_URL=', SOCKET_URL);
}

class SocketService {
  constructor() {
    this.socket = null;
    this.pendingEmits = [];
  }

  connect(userId) {
    if (!this.socket) {
      if (import.meta.env.VITE_CHAT_DEBUG) {
        console.debug('SocketService: attempting to connect to', SOCKET_URL, 'with userId=', userId);
      }
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 20000,
        // Allow cookies/auth cross-origin when server enables CORS credentials
        withCredentials: true,
      });

      this.socket.on('connect', () => {
        if (import.meta.env.VITE_CHAT_DEBUG) console.debug('Socket connected', { id: this.socket.id });

        // Flush any pending emits queued before the socket was connected
        if (this.pendingEmits && this.pendingEmits.length > 0) {
          if (import.meta.env.VITE_CHAT_DEBUG) console.debug('Flushing pending emits:', this.pendingEmits.length);
          this.pendingEmits.forEach(({ event, data }) => {
            try { this.socket.emit(event, data); } catch (e) { console.error('Failed to flush emit', e); }
          });
          this.pendingEmits = [];
        }

        if (userId) {
          this.socket.emit('user:join', userId);
        }
      });

      this.socket.on('reconnect_attempt', (attempt) => {
        if (import.meta.env.VITE_CHAT_DEBUG) console.debug('Socket reconnect attempt', attempt);
      });

      this.socket.on('reconnect_error', (err) => {
        console.error('Socket reconnect_error:', err);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Socket reconnect_failed: giving up');
      });

      this.socket.on('disconnect', () => {
        if (import.meta.env.VITE_CHAT_DEBUG) console.debug('Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        // Don't block the app, just log the error; reconnection logic will try again.
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (import.meta.env.VITE_CHAT_DEBUG) console.debug('SocketService: disconnecting socket');
      this.socket.disconnect();
      // Don't set socket to null - keep the instance for reconnection
      // this.socket = null;
    }
  }
  
  forceDisconnect() {
    // Use this method when you truly want to destroy the socket instance
    if (this.socket) {
      if (import.meta.env.VITE_CHAT_DEBUG) console.debug('SocketService: force disconnecting and destroying socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    // If socket is not initialized, attempt to connect (no userId available here)
    if (!this.socket) {
      if (import.meta.env.VITE_CHAT_DEBUG) console.debug('Socket not initialized, attempting to connect before emit');
      try { this.connect(); } catch (e) { /* ignore */ }
    }

    // If socket exists but isn't connected yet, queue the emit to flush on connect
    if (this.socket && !this.socket.connected) {
      if (import.meta.env.VITE_CHAT_DEBUG) console.debug('Socket not connected yet, queuing emit', event);
      this.pendingEmits.push({ event, data });
      return;
    }

    if (this.socket && this.socket.connected) {
      if (import.meta.env.VITE_CHAT_DEBUG) console.debug(`🚀 Socket emitting event: ${event}`, data);
      this.socket.emit(event, data);
      return;
    }

    // If we reach here there is no socket connected; push to pending emits as last resort
    this.pendingEmits.push({ event, data });
  }

  getSocket() {
    return this.socket;
  }
}

const socketService = new SocketService();

// Expose socketService to window for debugging in console
if (typeof window !== 'undefined') {
  window.socketService = socketService;
}

export default socketService;
