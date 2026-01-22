import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class ChatService {
    private socket: Socket | null = null;
    private token: string | null = null;

    connect(token: string) {
        if (this.socket?.connected) {
            return;
        }

        this.token = token;
        this.socket = io(SOCKET_URL, {
            auth: {
                token
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('✅ Chat socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Chat socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Chat socket connection error:', error.message);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinConversation(conversationId: string) {
        if (this.socket) {
            this.socket.emit('chat:join', conversationId);
        }
    }

    sendMessage(conversationId: string, content: string) {
        if (this.socket) {
            this.socket.emit('chat:message', {
                conversationId,
                content
            });
        }
    }

    sendTyping(conversationId: string, isTyping: boolean) {
        if (this.socket) {
            this.socket.emit('chat:typing', {
                conversationId,
                isTyping
            });
        }
    }

    markMessagesAsRead(conversationId: string) {
        if (this.socket) {
            this.socket.emit('chat:message:read', {
                conversationId
            });
        }
    }

    onNewMessage(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('chat:message:new', callback);
        }
    }

    onTyping(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('chat:typing', callback);
        }
    }

    onMessageRead(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('chat:message:read', callback);
        }
    }

    onError(callback: (error: any) => void) {
        if (this.socket) {
            this.socket.on('chat:error', callback);
        }
    }

    offNewMessage(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.off('chat:message:new', callback);
        }
    }

    offTyping(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.off('chat:typing', callback);
        }
    }

    offMessageRead(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.off('chat:message:read', callback);
        }
    }

    offError(callback: (error: any) => void) {
        if (this.socket) {
            this.socket.off('chat:error', callback);
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export default new ChatService();
