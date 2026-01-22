export interface NotificationData {
    _id: string;
    userId: string;
    title: string;
    message: string;
    type: 'Info' | 'Success' | 'Warning' | 'Error';
    isRead: boolean;
    link?: string;
    createdAt: string;
}
