import { Link, useLocation } from "react-router-dom";

import { useEffect, useState } from "react";
import { getUserFromToken } from "../../../auth/auth.ts";
import { backendApi } from "../../../api.ts";
import { NotificationBell } from "../../components/NotificationBell.tsx";
import { ThemeToggle } from "../../components/ThemeToggle/ThemeToggle.tsx";
import { FaCar, FaChevronDown, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { HiMenu, HiX } from 'react-icons/hi';


export interface UserData {
    _id?: string
    name: string,
    email: string,
    password: string
    role: string
    profileImage?: string | null | undefined
    nic?: string
    contactNumber?: string
    dateOfBirth?: string | Date | null
    gender?: string | null
    averageRating?: number
    totalRatings?: number
    experience?: number
    provincesVisited?: { province: string; count: number }[]
    isAvailable?: boolean
    isApproved?: boolean
    location?: {
        lat?: number
        lng?: number
        address?: string
    }
}

export function Navbar() {
    const [user, setUser] = useState<UserData | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close all menus when location changes
    useEffect(() => {
        setAdminMenuOpen(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
    }, [location]);

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            const tokenUser = getUserFromToken(accessToken);

            // Fetch fresh data to ensure profile image is up to date
            backendApi.get(`/api/v1/users/find-by-email/${tokenUser.email}`)
                .then(res => {
                    const userData = res.data;
                    setUser(userData);
                    if (userData.profileImage) {
                        if (userData.profileImage.startsWith("http")) {
                            setImageUrl(userData.profileImage);
                        } else {
                            setImageUrl(`http://localhost:3000/uploads/profile/${userData.profileImage}`);
                        }
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch user details", err);
                    // Fallback to token data
                    setUser(tokenUser);
                    if (tokenUser.profileImage) {
                        if (tokenUser.profileImage.startsWith("http")) {
                            setImageUrl(tokenUser.profileImage);
                        } else {
                            setImageUrl(`http://localhost:3000/uploads/profile/${tokenUser.profileImage}`);
                        }
                    }
                });
        }
    }, []);


    const handleLogout = () => {
        // Clear all session data
        localStorage.clear();
        // Force refresh to clear any cached states/interceptors
        window.location.replace('/login');
    };

    return (
        <nav className="glass-nav shadow-sm fixed top-0 left-0 w-full z-[100] transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-[110]">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary">
                            <FaCar className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-text-light">RideHub</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-6">
                        <Link to="/" className="text-text-muted hover:text-primary transition-colors font-medium">
                            Home
                        </Link>

                        {user && (
                            <Link to="/dashboard" className="text-text-muted hover:text-primary transition-colors font-medium">
                                Dashboard
                            </Link>
                        )}


                        {/* Common Links */}
                        <Link to="/trips" className="text-text-muted hover:text-primary transition-colors font-medium">
                            Trips
                        </Link>
                        <Link to="/vehicles" className="text-text-muted hover:text-primary transition-colors font-medium">
                            Vehicles
                        </Link>
                        {user && user.role !== 'admin' && (
                            <Link to="/driver" className="text-text-muted hover:text-primary transition-colors font-medium">
                                Drivers
                            </Link>
                        )}

                        {/* Driver Specific */}
                        {user && user.role === 'driver' && (
                            <Link to="/documents" className="text-text-muted hover:text-primary transition-colors font-medium">
                                Documents
                            </Link>
                        )}

                        {/* Help Center */}
                        {user && (
                            <Link to="/help-center" className="text-text-muted hover:text-primary transition-colors font-medium">
                                Help
                            </Link>
                        )}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Notification Bell */}
                        {user && <NotificationBell />}

                        {/* User Menu */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                            <FaUser className="text-white" />
                                        </div>
                                    )}
                                    <span className="hidden lg:block text-text-light font-medium">{user.name}</span>
                                    <FaChevronDown className={`hidden lg:block text-xs text-text-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-card-dark border border-border-dark rounded-xl shadow-2xl py-2 z-[120]">
                                        <Link
                                            to="/user"
                                            className="flex items-center gap-2 px-4 py-2 text-text-muted hover:bg-bg-dark hover:text-primary transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <FaUser className="text-sm" />
                                            Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setUserMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-text-muted hover:bg-bg-dark hover:text-danger transition-colors text-left"
                                        >
                                            <FaSignOutAlt className="text-sm" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg transition-all"
                            >
                                Login
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-text-light p-2"
                        >
                            {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-border-dark py-4 space-y-2">
                        <Link to="/" className="block px-4 py-2 text-text-muted hover:text-primary">Home</Link>
                        {user && <Link to="/dashboard" className="block px-4 py-2 text-text-muted hover:text-primary">Dashboard</Link>}

                        <Link to="/trips" className="block px-4 py-2 text-text-muted hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Trips</Link>
                        <Link to="/vehicles" className="block px-4 py-2 text-text-muted hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Vehicles</Link>
                        {user && user.role !== 'admin' && <Link to="/driver" className="block px-4 py-2 text-text-muted hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Drivers</Link>}
                        {user && user.role === 'driver' && <Link to="/documents" className="block px-4 py-2 text-text-muted hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Documents</Link>}
                        {user && <Link to="/help-center" className="block px-4 py-2 text-text-muted hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Help Center</Link>}

                        {/* Mobile User Profile Section */}
                        {user && (
                            <div className="pt-4 mt-4 border-t border-border-dark space-y-2">
                                <Link
                                    to="/user"
                                    className="flex items-center gap-3 px-4 py-2 text-text-muted hover:text-primary transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FaUser className="text-sm" />
                                    <span>My Profile</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-danger transition-colors text-left"
                                >
                                    <FaSignOutAlt className="text-sm" />
                                    <span>Logout Account</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Click outside to close dropdowns */}
            {(adminMenuOpen || userMenuOpen) && (
                <div
                    className="fixed inset-0 z-[105] bg-black/5"
                    onClick={() => {
                        setAdminMenuOpen(false);
                        setUserMenuOpen(false);
                    }}
                />
            )}
        </nav>
    );
}