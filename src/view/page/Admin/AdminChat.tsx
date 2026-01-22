import React, { useState, useEffect, useRef } from 'react';
import { backendApi } from '../../../api';
import chatService from '../../../utils/chatService';
import MessageList from '../../component/MessageList';
import MessageInput from '../../component/MessageInput';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';

interface Message {
    _id: string;
    senderId: {
        _id: string;
        name: string;
        role: string;
        profileImage?: string;
    };
    content: string;
    createdAt: string;
    isRead: boolean;
}

interface Conversation {
    _id: string;
    participants: any[];
    participantRoles: Array<{
        userId: string;
        role: string;
    }>;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: Map<string, number>;
}

const AdminChat: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [filter, setFilter] = useState<'all' | 'driver' | 'customer'>('all');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const token = useSelector((state: RootState) => state.auth.token);
    const currentUser = useSelector((state: RootState) => state.auth.user);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (token) {
            initializeAdminChat();
        }

        return () => {
            chatService.disconnect();
        };
    }, [token]);

    const initializeAdminChat = async () => {
        try {
            setLoading(true);

            // Connect socket
            if (!chatService.isConnected()) {
                chatService.connect(token!);
            }

            // Get all conversations
            await loadConversations();

            // Set up socket listeners
            const handleNewMessage = (data: any) => {
                setMessages(prev => {
                    // Check if message already exists
                    if (prev.some(msg => msg._id === data.message._id)) {
                        return prev;
                    }
                    return [...prev, data.message];
                });

                // Update conversation list
                loadConversations();

                // If this conversation is selected, mark as read
                if (selectedConversation && data.conversationId === selectedConversation._id) {
                    chatService.markMessagesAsRead(data.conversationId);
                }
            };

            const handleTyping = (data: any) => {
                if (selectedConversation && data.conversationId === selectedConversation._id && data.userId !== currentUser?._id) {
                    setIsTyping(data.isTyping);
                }
            };

            chatService.onNewMessage(handleNewMessage);
            chatService.onTyping(handleTyping);

            setLoading(false);
        } catch (error) {
            console.error('Error initializing admin chat:', error);
            setLoading(false);
        }
    };

    const loadConversations = async () => {
        try {
            const response = await backendApi.get(
                '/api/v1/chat/admin/conversations'
            );
            setConversations(response.data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const response = await backendApi.get(
                `/api/v1/chat/conversations/${conversationId}/messages`
            );
            setMessages(response.data);

            // Join conversation room
            chatService.joinConversation(conversationId);

            // Mark as read
            await backendApi.patch(
                `/api/v1/chat/conversations/${conversationId}/read`,
                {}
            );

            // Reload conversations to update unread counts
            loadConversations();
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation._id);
    };

    const handleSendMessage = (content: string) => {
        if (selectedConversation) {
            chatService.sendMessage(selectedConversation._id, content);
        }
    };

    const handleTyping = (isTyping: boolean) => {
        if (selectedConversation) {
            chatService.sendTyping(selectedConversation._id, isTyping);
        }
    };

    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.participants.find(p => p.role !== 'admin');
    };

    const getUnreadCount = (conversation: Conversation) => {
        if (currentUser?._id) {
            const unreadMap = conversation.unreadCount as any;
            return unreadMap?.[currentUser._id] || 0;
        }
        return 0;
    };

    const filteredConversations = conversations.filter(conv => {
        if (filter === 'all') return true;
        const otherParticipant = getOtherParticipant(conv);
        return otherParticipant?.role === filter;
    });

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Conversations Sidebar */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Messages</h2>

                    {/* Filter Tabs */}
                    <div className="flex space-x-2 mt-3">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('driver')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === 'driver'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Drivers
                        </button>
                        <button
                            onClick={() => setFilter('customer')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === 'customer'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Customers
                        </button>
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <p>No conversations yet</p>
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => {
                            const otherParticipant = getOtherParticipant(conversation);
                            const unreadCount = getUnreadCount(conversation);

                            return (
                                <div
                                    key={conversation._id}
                                    onClick={() => handleSelectConversation(conversation)}
                                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {otherParticipant?.profileImage ? (
                                                    <img
                                                        src={otherParticipant.profileImage}
                                                        alt={otherParticipant.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    otherParticipant?.name.charAt(0).toUpperCase()
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-800 truncate">
                                                        {otherParticipant?.name || 'Unknown'}
                                                    </h3>
                                                    {unreadCount > 0 && (
                                                        <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-1 ml-2">
                                                            {unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 capitalize">
                                                    {otherParticipant?.role || 'User'}
                                                </p>
                                                <p className="text-sm text-gray-600 truncate mt-1">
                                                    {conversation.lastMessage || 'No messages yet'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                                    {getOtherParticipant(selectedConversation)?.profileImage ? (
                                        <img
                                            src={getOtherParticipant(selectedConversation)?.profileImage}
                                            alt={getOtherParticipant(selectedConversation)?.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        getOtherParticipant(selectedConversation)?.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        {getOtherParticipant(selectedConversation)?.name || 'Unknown'}
                                    </h3>
                                    <p className="text-sm text-gray-500 capitalize">
                                        {getOtherParticipant(selectedConversation)?.role || 'User'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <MessageList
                                messages={messages}
                                currentUserId={currentUser?._id || ''}
                                isTyping={isTyping}
                                messagesEndRef={messagesEndRef}
                            />
                        </div>

                        {/* Input */}
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            onTyping={handleTyping}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <p className="text-lg">Select a conversation to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
