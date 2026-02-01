import React from 'react';

import type { ChatMessage as Message } from '../../utils/chatService';

interface MessageListProps {
    messages: Message[];
    currentUserId: string;
    isTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    currentUserId,
    isTyping,
    messagesEndRef
}) => {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            ) : (
                messages.map((message) => {
                    const isOwnMessage = message.senderId._id === currentUserId;

                    return (
                        <div
                            key={message._id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {/* Avatar */}
                                {!isOwnMessage && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold text-sm">
                                        {message.senderId.profileImage ? (
                                            <img
                                                src={message.senderId.profileImage}
                                                alt={message.senderId.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            message.senderId.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div>
                                    {!isOwnMessage && (
                                        <p className="text-xs text-gray-500 mb-1 px-1">
                                            {message.senderId.name}
                                        </p>
                                    )}
                                    <div
                                        className={`px-4 py-2 rounded-lg ${isOwnMessage
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-800'
                                            }`}
                                    >
                                        <p className="text-sm break-words">{message.content}</p>
                                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {formatTime(message.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Typing Indicator */}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
