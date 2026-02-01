import { useEffect, useState } from "react";
import { getUserFromToken } from "../../../auth/auth.ts";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import type { RootState } from "../../../store/store.ts";
import { setCredentials } from "../../../slices/authSlice.ts";
import { FaCar, FaMapMarkerAlt, FaClock, FaStar, FaArrowRight } from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';
import { CustomerDashboard } from "../DashBoard/CustomerDashboard.tsx";
import { DriverDashboard } from "../DashBoard/DriverDashboard.tsx";

interface User {
    _id: string;
    name: string;
    role: 'customer' | 'driver' | 'admin';
    profileImage?: string;
}

export function Home() {
    const user = useSelector((state: RootState) => state.auth.user) as User | null;
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            const userData = getUserFromToken(accessToken);
            dispatch(setCredentials({
                user: userData,
                role: userData.role,
                token: accessToken
            }));
        }
    }, [dispatch]);

    // If user is logged in, show role-based dashboard
    if (user) {
        if (user.role === 'customer') {
            return <CustomerDashboard />;
        } else if (user.role === 'driver') {
            return <DriverDashboard />;
        } else if (user.role === 'admin') {
            // Redirect admin to dashboard
            navigate('/dashboard');
            return null;
        }
    }

    // Public landing page for non-logged-in users
    return (
        <div className="min-h-screen relative overflow-hidden bg-bg-dark">
            {/* Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] animate-pulse"
                    style={{ backgroundColor: '#4F9CF9' }}
                ></div>
                <div
                    className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] animate-pulse"
                    style={{ backgroundColor: '#22C55E' }}
                ></div>
            </div>

            {/* Hero Section */}
            <div className={`relative z-10 pt-20 pb-16 px-4 lg:px-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary shadow-lg shadow-primary/30">
                                    <FaCar className="text-white text-2xl" />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-text-light">RideHub</h1>
                            </div>
                            <h2 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-text-light">
                                Your Journey,<br />
                                <span className="text-primary">Simplified</span>
                            </h2>
                            <p className="text-xl text-text-muted mb-8 leading-relaxed">
                                Experience seamless transportation with our modern ride booking platform.
                                Fast, reliable, and designed for you.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/login"
                                    className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center gap-2 group"
                                >
                                    Get Started
                                    <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-card-dark border-2 border-primary text-primary font-bold px-8 py-4 rounded-xl hover:bg-primary/10 transition-all"
                                >
                                    Create Account
                                </Link>
                            </div>
                        </div>

                        {/* Right Illustration */}
                        <div className="hidden lg:block">
                            <div className="relative">
                                <svg viewBox="0 0 600 500" className="w-full h-auto">
                                    <defs>
                                        <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#4F9CF9" />
                                            <stop offset="100%" stopColor="#22C55E" />
                                        </linearGradient>
                                    </defs>
                                    {/* Car Illustration */}
                                    <g transform="translate(100, 150)">
                                        <rect x="50" y="60" width="200" height="80" rx="10" fill="url(#carGradient)" />
                                        <path d="M70 60 L70 40 Q70 20 100 20 Q130 20 130 40 L130 60" stroke="url(#carGradient)" strokeWidth="8" fill="none" />
                                        <circle cx="100" cy="80" r="20" fill="#0B0F19" />
                                        <circle cx="200" cy="80" r="20" fill="#0B0F19" />
                                        <circle cx="100" cy="80" r="12" fill="#1F2937" />
                                        <circle cx="200" cy="80" r="12" fill="#1F2937" />
                                    </g>
                                    {/* Floating Elements */}
                                    <circle cx="100" cy="100" r="4" fill="#4F9CF9" opacity="0.6" className="animate-pulse" />
                                    <circle cx="500" cy="300" r="5" fill="#22C55E" opacity="0.5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className={`relative z-10 py-16 px-4 lg:px-8 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <div className="max-w-7xl mx-auto">
                    <h3 className="text-3xl font-bold text-center text-text-light mb-12">
                        Why Choose <span className="text-primary">RideHub</span>?
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: FaCar, title: "Premium Fleet", desc: "Arrive in style with our curated vehicle selection", color: "primary" },
                            { icon: FaMapMarkerAlt, title: "Real-time Tracking", desc: "Track your ride in real-time with live location updates", color: "accent" },
                            { icon: FaClock, title: "24/7 Available", desc: "Round-the-clock service whenever you need it", color: "primary" },
                            { icon: FaStar, title: "Rated Drivers", desc: "Experience the best with our verified professional drivers", color: "warning" }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="bg-card-dark/80 backdrop-blur-xl rounded-2xl border border-border-dark p-6 hover:border-primary/50 transition-all group"
                            >
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                                    style={{
                                        backgroundColor: feature.color === 'primary' ? 'rgba(79, 156, 249, 0.1)' : feature.color === 'accent' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(250, 204, 21, 0.1)',
                                        border: `1px solid ${feature.color === 'primary' ? 'rgba(79, 156, 249, 0.2)' : feature.color === 'accent' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(250, 204, 21, 0.2)'}`
                                    }}
                                >
                                    <feature.icon
                                        className="text-2xl"
                                        style={{ color: feature.color === 'primary' ? '#4F9CF9' : feature.color === 'accent' ? '#22C55E' : '#FACC15' }}
                                    />
                                </div>
                                <h4 className="text-lg font-bold text-text-light mb-2">{feature.title}</h4>
                                <p className="text-sm text-text-muted">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className={`relative z-10 py-16 px-4 lg:px-8 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-card-dark/80 backdrop-blur-xl rounded-3xl border border-border-dark p-12">
                        <h3 className="text-3xl font-bold text-text-light mb-4">
                            Ready to Start Your Journey?
                        </h3>
                        <p className="text-text-muted mb-8 text-lg">
                            Join thousands of satisfied customers and drivers on our platform
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                to="/register"
                                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center gap-2 group"
                            >
                                Create Account
                                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/login"
                                className="bg-card-dark border-2 border-primary text-primary font-bold px-8 py-4 rounded-xl hover:bg-primary/10 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}