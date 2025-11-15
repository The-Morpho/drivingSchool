import { io, Socket } from 'socket.io-client';

/**
 * Socket Service for Real-time Chat
 * Manages Socket.io connection and chat events
 */

let socket: Socket | null = null;

interface MessageData {
  _id: string;
  room_id: string;
  sender_username: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface RoomData {
  room_id: string;
  staff_name?: string;
  customer_name?: string;
  staff_username?: string;
  customer_username?: string;
  last_message: string;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

/**
 * Initialize Socket.io connection
 */
export const initSocket = (username: string, role: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  // Connect to Socket.io server
  socket = io('http://localhost:5000', {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Connection established
  socket.on('connect', () => {
    console.log('📡 Connected to chat server');
    
    // Authenticate with server
    socket!.emit('authenticate', { username, role });
  });

  // Connection error
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  // Disconnected
  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect from Socket.io server
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Event Listeners
 */

export const onAuthenticated = (callback: (data: { success: boolean; username: string; role: string }) => void): void => {
  socket?.on('authenticated', callback);
};

export const onRoomsJoined = (callback: (data: { rooms: RoomData[] }) => void): void => {
  socket?.on('rooms_joined', callback);
};

export const onNewMessage = (callback: (message: MessageData) => void): void => {
  socket?.on('new_message', callback);
};

export const onUserTyping = (callback: (data: { username: string; isTyping: boolean }) => void): void => {
  socket?.on('user_typing', callback);
};

export const onError = (callback: (error: { message: string }) => void): void => {
  socket?.on('error', callback);
};

/**
 * Event Emitters
 */

export const sendMessage = (room_id: string, message: string): void => {
  if (!socket?.connected) {
    console.error('Socket not connected');
    return;
  }

  socket.emit('send_message', { room_id, message });
};

export const markAsRead = (room_id: string): void => {
  if (!socket?.connected) return;
  socket.emit('mark_read', { room_id });
};

export const sendTypingIndicator = (room_id: string, isTyping: boolean): void => {
  if (!socket?.connected) return;
  socket.emit('typing', { room_id, isTyping });
};

/**
 * Remove all event listeners
 */
export const removeAllListeners = (): void => {
  socket?.removeAllListeners();
};
