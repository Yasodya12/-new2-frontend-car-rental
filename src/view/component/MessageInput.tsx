import React, { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    onTyping: (isTyping: boolean) => void;
    disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    onTyping,
    disabled = false
}) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMessage(value);

        // Typing indicator logic
        if (value && !isTyping) {
            setIsTyping(true);
            onTyping(true);
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            onTyping(false);
            typingTimeoutRef.current = null;
        }, 1000);
    };

    const handleSend = () => {
        const trimmedMessage = message.trim();
        if (trimmedMessage && !disabled) {
            onSendMessage(trimmedMessage);
            setMessage('');
            setIsTyping(false);
            onTyping(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    value={message}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={disabled}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    aria-label="Send message"
                >
                    {/* Send Icon */}
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
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
