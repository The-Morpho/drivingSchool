import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { 
  initSocket, 
  disconnectSocket, 
  onAuthenticated, 
  onRoomsJoined, 
  onNewMessage, 
  onUserTyping,
  sendMessage, 
  markAsRead, 
  sendTypingIndicator
} from '../services/socket';
import { apiService } from '../services/api';

interface Message {
  _id: string;
  room_id: string;
  sender_username: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface ChatRoom {
  room_id: string;
  staff_name?: string;
  customer_name?: string;
  staff_username?: string;
  customer_username?: string;
  last_message: string;
  last_message_at: string | null;
  unread_count: number;
}

interface AssignedPerson {
  staff_id?: number;
  customer_id?: number;
  first_name: string;
  last_name: string;
  username: string;
}

export const Chat: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availablePeople, setAvailablePeople] = useState<AssignedPerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [allRooms, setAllRooms] = useState<ChatRoom[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const selectedRoomRef = useRef<ChatRoom | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  // Keep ref in sync with selectedRoom state
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    if (!user) return;

    // Initialize Socket.io connection
    initSocket(user.username, user.role);

    // Setup event listeners
    onAuthenticated((data) => {
      if (data.success) {
        setConnected(true);
        console.log('✅ Authenticated as', data.username);
      }
    });

    onRoomsJoined((data) => {
      setRooms(data.rooms);
      console.log('Joined rooms:', data.rooms.length);
    });

    onNewMessage((message) => {
      console.log('📩 Received message:', message);
      
      // Add message to current chat if it's the selected room
      setMessages((prev) => {
        const currentRoom = selectedRoomRef.current;
        if (currentRoom && message.room_id === currentRoom.room_id) {
          console.log('✅ Adding message to current chat');
          return [...prev, message];
        }
        return prev;
      });

      // Update room's last message
      setRooms((prev) =>
        prev.map((room) => {
          const currentRoom = selectedRoomRef.current;
          return room.room_id === message.room_id
            ? { 
                ...room, 
                last_message: message.message, 
                last_message_at: message.created_at,
                unread_count: currentRoom?.room_id === room.room_id ? 0 : room.unread_count + 1
              }
            : room;
        })
      );
      
      // Mark as read if viewing this room
      const currentRoom = selectedRoomRef.current;
      if (currentRoom && message.room_id === currentRoom.room_id) {
        markAsRead(message.room_id);
      }
    });

    onUserTyping((data) => {
      if (data.username !== user.username) {
        setOtherUserTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [user?.username, user?.role]);

  // Load all chat rooms for manager/admin
  useEffect(() => {
    if (isManagerOrAdmin) {
      loadAllRooms();
    }
  }, [isManagerOrAdmin]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAllRooms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat/rooms/all', {
        headers: {
          'x-account-id': user.account_id,
          'x-username': user.username,
          'x-user-role': user.role,
          'x-user-type': user.userType
        }
      });
      const data = await response.json();
      setAllRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to load all rooms:', error);
    }
  };

  const loadAvailablePeople = async () => {
    setLoadingPeople(true);
    try {
      console.log('Loading available people for role:', user.role);
      
      if (user.role === 'Staff' || user.role === 'Instructor' || user.role === 'instructor') {
        // Get assigned customers
        console.log('Fetching my customers...');
        const response = await apiService.assignments.getMyCustomers();
        console.log('API Response:', response.data);
        // API returns { staff_id, total_customers, customers: [...] }
        const customers = response.data.customers || [];
        console.log('Customers loaded:', customers.length, customers);
        setAvailablePeople(customers);
      } else if (user.role === 'Customer' || user.role === 'customer') {
        // Get assigned staff
        console.log('Fetching my staff...');
        const response = await apiService.assignments.getMyStaff();
        console.log('API Response:', response.data);
        // API returns { customer_id, total_staff, staff: [...] }
        const staff = response.data.staff || [];
        console.log('Staff loaded:', staff.length, staff);
        setAvailablePeople(staff);
      }
    } catch (error: any) {
      console.error('Failed to load available people:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      setAvailablePeople([]);
    } finally {
      setLoadingPeople(false);
    }
  };

  const handleStartNewChat = async (person: AssignedPerson) => {
    try {
      console.log('Starting chat with:', person);
      
      const staff_username = user.role === 'Customer' || user.role === 'customer' 
        ? person.username 
        : user.username;
      const customer_username = user.role === 'Customer' || user.role === 'customer' 
        ? user.username 
        : person.username;

      console.log('Creating room:', { staff_username, customer_username });

      // Create or get existing room with auth headers
      const response = await fetch('http://localhost:5000/api/chat/rooms/create-or-get', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-account-id': user.account_id,
          'x-username': user.username,
          'x-user-role': user.role,
          'x-user-type': user.userType
        },
        body: JSON.stringify({ staff_username, customer_username })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to create chat room');
      }

      const data = await response.json();
      console.log('Room created/found:', data);
      const room = data.room;

      // Create ChatRoom object
      const newRoom: ChatRoom = {
        room_id: room.room_id,
        staff_name: room.staff_name,
        customer_name: room.customer_name,
        staff_username: room.staff_username,
        customer_username: room.customer_username,
        last_message: room.last_message || '',
        last_message_at: room.last_message_at,
        unread_count: 0
      };

      // Add room to list if it's new
      setRooms((prev) => {
        const exists = prev.find(r => r.room_id === room.room_id);
        if (exists) {
          console.log('Room already in list');
          return prev;
        }
        console.log('Adding new room to list');
        return [newRoom, ...prev];
      });

      // Select the room and load messages
      setSelectedRoom(newRoom);
      setShowNewChatModal(false);
      
      // Reload page to properly join the socket room
      console.log('Reloading to join socket room...');
      window.location.reload();
      
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      alert(`Failed to start chat: ${error.message || 'Please try again.'}`);
    }
  };

  const loadMessages = async (room: ChatRoom) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/${room.room_id}/messages?username=${user.username}`,
        {
          headers: {
            'x-account-id': user.account_id,
            'x-username': user.username,
            'x-user-role': user.role,
            'x-user-type': user.userType
          }
        }
      );
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Mark messages as read
      markAsRead(room.room_id);
      
      // Update unread count
      setRooms((prev) =>
        prev.map((r) =>
          r.room_id === room.room_id ? { ...r, unread_count: 0 } : r
        )
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    loadMessages(room);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoom || !messageInput.trim()) return;

    sendMessage(selectedRoom.room_id, messageInput.trim());
    setMessageInput('');
    
    // Stop typing indicator
    sendTypingIndicator(selectedRoom.room_id, false);
    setIsTyping(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!selectedRoom) return;

    // Send typing indicator
    if (!isTyping) {
      sendTypingIndicator(selectedRoom.room_id, true);
      setIsTyping(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(selectedRoom.room_id, false);
      setIsTyping(false);
    }, 2000);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteConversation = async (room: ChatRoom) => {
    if (!window.confirm(`Are you sure you want to delete the conversation between ${room.staff_name} and ${room.customer_name}?\n\nThis will permanently delete all messages and cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/chat/${room.room_id}`, {
        method: 'DELETE',
        headers: {
          'x-account-id': user.account_id,
          'x-username': user.username,
          'x-user-role': user.role,
          'x-user-type': user.userType
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      const data = await response.json();
      
      // Remove from allRooms list
      setAllRooms((prev) => prev.filter(r => r.room_id !== room.room_id));
      
      // Clear selected room if it was deleted
      if (selectedRoom?.room_id === room.room_id) {
        setSelectedRoom(null);
        setMessages([]);
      }

      alert(`Conversation deleted successfully!\n${data.messages_deleted} messages were removed.`);
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      alert(`Failed to delete conversation: ${error.message}`);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Please log in to access chat</p>
      </div>
    );
  }

  // Manager view - display all conversations
  if (isManagerOrAdmin) {
    return (
      <div className="h-screen flex bg-gray-100">
        <div className="container mx-auto flex bg-white rounded-2xl shadow-xl overflow-hidden m-4">
        {/* Conversations List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <MessageCircle size={24} />
              </div>
              <h2 className="text-2xl font-bold">All Conversations</h2>
            </div>
            <p className="text-purple-100 text-sm">Monitor staff-customer chats</p>
            <div className="mt-3 bg-white bg-opacity-20 rounded-lg px-3 py-2 inline-block">
              <p className="text-xs font-semibold">{allRooms.length} Active Chats</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {allRooms.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-100">
                  <MessageCircle className="text-purple-400 mx-auto mb-4" size={48} />
                  <p className="text-gray-700 font-bold text-lg">No conversations yet</p>
                  <p className="text-gray-500 text-sm mt-2">Staff-customer chats will appear here</p>
                </div>
              </div>
            ) : (
              allRooms.map((room) => (
                <div
                  key={room.room_id}
                  onClick={() => handleSelectRoom(room)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-purple-50 ${
                    selectedRoom?.room_id === room.room_id ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-l-purple-600 shadow-sm' : 'hover:border-l-4 hover:border-l-purple-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                        {room.staff_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                        {room.customer_name?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-bold text-gray-800">{room.staff_name}</p>
                          <p className="text-sm text-purple-600 font-semibold">→ {room.customer_name}</p>
                        </div>
                        {room.last_message_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(room.last_message_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {room.last_message && (
                        <p className="text-sm text-gray-600 truncate mt-1">{room.last_message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 flex items-center gap-3 shadow-sm">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                    {selectedRoom.staff_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xl font-bold text-gray-700">↔</div>
                  <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                    {selectedRoom.customer_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {selectedRoom.staff_name} ↔ {selectedRoom.customer_name}
                    </h3>
                    <p className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                      👁️ Monitoring Mode (Read-Only)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteConversation(selectedRoom)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  title="Delete this conversation"
                >
                  <Trash2 size={18} />
                  Stop Conversation
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((msg) => {
                  const isStaffMessage = msg.sender_username === selectedRoom.staff_username;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isStaffMessage ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className="flex items-start gap-3 max-w-lg">
                        {isStaffMessage && (
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
                            {msg.sender_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`px-5 py-3 rounded-2xl shadow-sm ${
                            isStaffMessage
                              ? 'bg-white text-gray-800 border border-gray-200'
                              : 'bg-gradient-to-r from-green-600 to-teal-600 text-white'
                          }`}
                        >
                          <p className={`text-xs font-bold mb-2 ${isStaffMessage ? 'text-blue-600' : 'text-green-100'}`}>
                            {msg.sender_name} ({msg.sender_role})
                          </p>
                          <p className="break-words leading-relaxed">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isStaffMessage ? 'text-gray-600' : 'text-green-100'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                        {!isStaffMessage && (
                          <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
                            {msg.sender_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Read-only notice */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-t-2 border-purple-200 p-5 text-center shadow-inner">
                <p className="text-sm font-bold text-purple-800 flex items-center justify-center gap-2">
                  <span className="text-lg">👁️</span>
                  Manager Monitoring Mode - Read-Only Access
                  <span className="text-lg">🔒</span>
                </p>
                <p className="text-xs text-purple-600 mt-1">You can view all conversations but cannot send messages</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center p-8">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <MessageCircle className="text-purple-600" size={48} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Manager Monitoring</h3>
                <p className="text-gray-600 mb-2 max-w-sm mx-auto">Select a conversation from the left to monitor staff-customer communications</p>
                <p className="text-sm text-purple-600 font-semibold">👁️ Read-only access</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // Staff/Customer view - original layout
  return (
    <div className="h-screen flex bg-gray-100">
      <div className="container mx-auto flex bg-white rounded-2xl shadow-xl overflow-hidden m-4">
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                  <MessageCircle size={24} className="text-blue-600" />
                  Start New Conversation
                </h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-white p-2 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {loadingPeople ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
                </div>
              ) : availablePeople.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="text-gray-400" size={40} />
                  </div>
                  <p className="text-gray-700 font-bold text-lg">No {user.role === 'Customer' ? 'instructors' : 'customers'} available</p>
                  <p className="text-sm mt-2 text-gray-500">You need an assignment first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availablePeople.map((person) => {
                    // Check if chat already exists
                    const existingRoom = rooms.find(r => 
                      user.role === 'Customer' 
                        ? r.staff_username === person.username
                        : r.customer_username === person.username
                    );

                    return (
                      <button
                        key={person.username}
                        onClick={() => handleStartNewChat(person)}
                        disabled={!!existingRoom}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          existingRoom
                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                            : 'hover:bg-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md ${
                          existingRoom ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {person.first_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">
                            {person.first_name} {person.last_name}
                          </p>
                          <p className="text-sm text-gray-600">@{person.username}</p>
                          {existingRoom && (
                            <p className="text-xs text-green-600 mt-1 font-semibold">✓ Already chatting</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Chat Rooms List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <MessageCircle size={24} />
              </div>
              <h2 className="text-2xl font-bold">Messages</h2>
            </div>
            <button
              onClick={() => {
                loadAvailablePeople();
                setShowNewChatModal(true);
              }}
              className="p-2 rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition-all shadow-lg hover:scale-110"
              title="Start new conversation"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'} animate-pulse`} />
              <span className="text-xs text-blue-100 font-semibold">
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
              <span className="text-xs font-semibold">{rooms.length} Chats</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-100">
                <MessageCircle className="text-blue-400 mx-auto mb-4" size={48} />
                <p className="text-gray-700 font-bold text-lg">No conversations yet</p>
                <p className="text-gray-500 text-sm mt-2">Click the + button to start chatting</p>
              </div>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.room_id}
                onClick={() => handleSelectRoom(room)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-blue-50 ${
                  selectedRoom?.room_id === room.room_id ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-l-blue-600 shadow-sm' : 'hover:border-l-4 hover:border-l-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0">
                    {(user.role === 'Customer' ? room.staff_name : room.customer_name)?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-800 truncate">
                        {user.role === 'Customer' ? room.staff_name : room.customer_name}
                      </h3>
                      {room.unread_count > 0 && (
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-2 font-bold shadow-md">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {room.last_message || 'No messages yet'}
                    </p>
                    {room.last_message_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(room.last_message_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 flex items-center gap-3 shadow-sm">
              <button
                onClick={() => setSelectedRoom(null)}
                className="lg:hidden bg-white p-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                  {(user.role === 'Customer' ? selectedRoom.staff_name : selectedRoom.customer_name)?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {user.role === 'Customer' ? selectedRoom.staff_name : selectedRoom.customer_name}
                  </h3>
                  {otherUserTyping ? (
                    <p className="text-xs text-blue-600 italic font-semibold flex items-center gap-1">
                      <span className="animate-pulse">●</span> typing...
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Online</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_username === user.username;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs font-bold mb-2 text-gray-600">{msg.sender_name}</p>
                      )}
                      <p className="break-words leading-relaxed">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 font-bold"
                >
                  <Send size={20} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center p-8">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <MessageCircle className="text-blue-600" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Chat</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">Select a conversation from the left or start a new one to begin messaging</p>
              <button
                onClick={() => {
                  loadAvailablePeople();
                  setShowNewChatModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
