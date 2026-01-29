import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaGlobeAmericas, FaComments, FaUserCheck, FaTags, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface AdminSidebarProps {
    isAdmin: boolean;
}

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    emoji: string;
}

const navItems: NavItem[] = [
    { path: '/live-map', label: 'Live Map', icon: <FaGlobeAmericas />, emoji: '🌍' },
    { path: '/admin/chat', label: 'Messages', icon: <FaComments />, emoji: '💬' },
    { path: '/admin/approvals', label: 'Driver Approvals', icon: <FaUserCheck />, emoji: '👤' },
    { path: '/promotions', label: 'Promotions', icon: <FaTags />, emoji: '🏷️' },
];

export function AdminSidebar({ isAdmin }: AdminSidebarProps) {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isAdmin) return null;

    return (
        <aside
            className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card-dark border-r border-border-dark z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-56'
                }`}
        >
            {/* Collapse Toggle Button */}
            {!isMobile && (
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-6 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary/80 transition-colors z-10"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
                </button>
            )}

            {/* Sidebar Header */}
            <div className={`p-4 border-b border-border-dark ${isCollapsed ? 'text-center' : ''}`}>
                {isCollapsed ? (
                    <span className="text-lg">🛡️</span>
                ) : (
                    <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">Admin Panel</h2>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="p-2 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-primary/20 text-primary border-l-4 border-primary'
                                    : 'text-text-muted hover:bg-bg-dark hover:text-text-light'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className={`text-lg ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`}>
                                {item.emoji}
                            </span>
                            {!isCollapsed && (
                                <span className="font-medium whitespace-nowrap">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section - Quick Stats */}
            {!isCollapsed && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-dark">
                    <div className="text-xs text-text-muted text-center">
                        <span className="block">Admin Dashboard</span>
                        <span className="text-primary font-semibold">RideHub Control Center</span>
                    </div>
                </div>
            )}
        </aside>
    );
}
