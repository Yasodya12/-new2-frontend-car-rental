import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllNotifications, fetchUnreadCount, markAsRead } from '../../slices/notificationSlice';
import { Link } from 'react-router-dom';
import type { NotificationData } from '../../Model/NotificationData';

export function NotificationBell() {
    const dispatch = useDispatch();
    const { notifications, unreadCount } = useSelector((state: any) => state.notification);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Fetch unread count on mount
        dispatch(fetchUnreadCount() as any);

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            dispatch(fetchUnreadCount() as any);
        }, 30000);

        return () => clearInterval(interval);
    }, [dispatch]);

    const handleBellClick = () => {
        if (!showDropdown) {
            // Fetch all notifications when opening dropdown
            dispatch(fetchAllNotifications() as any);
        }
        setShowDropdown(!showDropdown);
    };

    const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
        e.preventDefault();
        e.stopPropagation();
        await dispatch(markAsRead(notificationId) as any);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'Success':
                return '✓';
            case 'Error':
                return '✕';
            case 'Warning':
                return '⚠';
            default:
                return 'ℹ';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'Success':
                return 'text-green-600';
            case 'Error':
                return 'text-red-600';
            case 'Warning':
                return 'text-yellow-600';
            default:
                return 'text-blue-600';
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={handleBellClick}
                className="relative p-2 text-white hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                        <span className="text-sm text-blue-600 font-medium">
                            {unreadCount} unread
                        </span>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification: NotificationData) => (
                                <div
                                    key={notification._id}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${notification.isRead ? 'bg-gray-50 opacity-70' : 'bg-white'
                                        }`}
                                >
                                    <Link
                                        to={notification.link || '#'}
                                        className="block"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <span className={`text-xl ${getNotificationColor(notification.type)}`}>
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${notification.isRead ? 'font-normal text-gray-600' : 'font-semibold text-gray-900'
                                                    }`}>
                                                    {notification.title}
                                                </p>
                                                <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'
                                                    }`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(e, notification._id)}
                                                    className="flex-shrink-0 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                    title="Mark as read"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}

