import { Link } from "react-router-dom";
import logo from "../../../assets/logo.png";
import { useEffect, useState } from "react";
import { getUserFromToken } from "../../../auth/auth.ts";
import { backendApi } from "../../../api.ts";
import { NotificationBell } from "../../components/NotificationBell.tsx";


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



    // ... existing imports

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


    return (
        <nav className="bg-blue-600 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center text-xl font-bold space-x-2">
                    <img src={logo} alt="logo" className="h-8 w-8 object-cover" />
                    <span>Transport Manager</span>
                </Link>

                <div className="flex items-center space-x-6">
                    <Link to="/" className="hover:underline">Home</Link>
                    {user && (
                        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
                    )}
                    {user && user.role === 'admin' && (
                        <>
                            <Link to="/live-map" className="hover:underline">Live Map 🌍</Link>
                            <Link to="/admin/chat" className="hover:underline">Messages 💬</Link>
                            <Link to="/admin/documents" className="hover:underline">Verifications 📄</Link>
                        </>
                    )}
                    <Link to="/driver" className="hover:underline">Drivers</Link>
                    <Link to="/trips" className="hover:underline">Trips</Link>
                    <Link to="/vehicles" className="hover:underline">Vehicles</Link>
                    {user && user.role === 'admin' && (
                        <Link to="/promotions" className="hover:underline">Offers 🏷️</Link>
                    )}
                    {user && user.role === 'driver' && (
                        <Link to="/documents" className="hover:underline">My Documents 📄</Link>
                    )}
                    {user && (
                        <Link to="/help-center" className="hover:underline">Help Center 🎫</Link>
                    )}
                    {!user && (
                        <Link to="/login" className="hover:underline">Login</Link>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {/* Notification Bell */}
                    {user && <NotificationBell />}

                    {/* User Profile */}
                    {user && (
                        <Link to="/user">
                            <div className="flex items-center space-x-2">
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full border border-white object-cover"
                                    />
                                )}
                                <span>{user.name}</span>
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </nav>

    )
}