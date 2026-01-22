import React, { useState, useEffect, useRef } from 'react';
import { backendApi } from '../../api';
import chatService from '../../utils/chatService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

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
    lastMessage: string;
    lastMessageTime: string;
}

interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    token: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    isOpen,
    onClose,
    currentUserId,
    token
}) => {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && token) {
            initializeChat();
        }

        return () => {
            if (conversation) {
                chatService.markMessagesAsRead(conversation._id);
            }
        };
    }, [isOpen, token]);

    const initializeChat = async () => {
        try {
            setLoading(true);

            // Connect socket
            if (!chatService.isConnected()) {
                chatService.connect(token);
            }

            // Get or create conversation
            const convResponse = await backendApi.post(
                '/api/v1/chat/conversations',
                {}
            );

            const conv = convResponse.data;
            if (!conv || !conv._id) {
                throw new Error("Invalid conversation data received");
            }
            setConversation(conv);

            // Get messages
            const messagesResponse = await backendApi.get(
                `/api/v1/chat/conversations/${conv._id}/messages`
            );

            if (Array.isArray(messagesResponse.data)) {
                setMessages(messagesResponse.data);
            }

            // Join conversation room
            chatService.joinConversation(conv._id);

            // Set up socket listeners
            const handleNewMessage = (data: any) => {
                if (data.conversationId === conv._id) {
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m._id === data.message._id)) return prev;
                        return [...prev, data.message];
                    });
                    chatService.markMessagesAsRead(conv._id);
                }
            };

            const handleTyping = (data: any) => {
                if (data.conversationId === conv._id && data.userId !== currentUserId) {
                    setIsTyping(data.isTyping);
                }
            };

            // Clean up old listeners first to be safe
            chatService.offNewMessage(handleNewMessage);
            chatService.onNewMessage(handleNewMessage);
            chatService.onTyping(handleTyping);

            // Mark messages as read when window opens
            await backendApi.patch(
                `/api/v1/chat/conversations/${conv._id}/read`,
                {}
            );

            setLoading(false);
        } catch (error) {
            console.error('Error initializing chat:', error);
            // Don't leave it loading forever if error occurs
            setLoading(false);
        }
    };

    const handleSendMessage = (content: string) => {
        if (conversation) {
            chatService.sendMessage(conversation._id, content);
        }
    };

    const handleTyping = (isTyping: boolean) => {
        if (conversation) {
            chatService.sendTyping(conversation._id, isTyping);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                    </svg>
                    <div>
                        <h3 className="font-semibold">Chat with Admin</h3>
                        <p className="text-xs text-blue-100">Online</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="hover:bg-blue-700 rounded-full p-1 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <MessageList
                    messages={messages}
                    currentUserId={currentUserId}
                    isTyping={isTyping}
                    messagesEndRef={messagesEndRef}
                />
            )}

            {/* Input Area */}
            <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                disabled={loading}
            />
        </div>
    );
};

export default ChatWindow;
