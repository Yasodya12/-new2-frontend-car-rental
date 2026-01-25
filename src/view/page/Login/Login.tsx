import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { backendApi } from "../../../api.ts";
import { getUserFromToken } from "../../../auth/auth.ts";
import type { UserData } from "../../../Model/userData.ts";
import { GoogleLogin } from '@react-oauth/google';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowRight } from 'react-icons/hi';
import { FaCar, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

export function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        try {
            const response = await backendApi.post("/api/v1/auth/google", {
                credential: credentialResponse.credential
            });

            const accessToken = response.data.accessToken;
            const refreshToken = response.data.refreshToken;
            const profileIncomplete = response.data.profileIncomplete;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);

            const user: UserData = getUserFromToken(accessToken);

            localStorage.setItem('userName', user.name);
            localStorage.setItem('role', user.role);

            // Check if profile needs completion
            if (profileIncomplete) {
                localStorage.setItem("profileComplete", "false");
                navigate("/complete-profile");
                return;
            }

            localStorage.setItem("profileComplete", "true");

            if (user.role === 'customer' || user.role === 'driver') {
                alert("Login successful.");
                navigate("/home");
            } else if (user.role === 'admin') {
                alert("Login successful.");
                navigate("/dashboard");
            }

            // Send login notification email
            try {
                await backendApi.post("/api/v1/email/send-login-notification", {
                    to: user.email,
                    subject: "Login Alert",
                    message: `Successful Google login detected for your account (${user.name}) at ${new Date().toLocaleString()}.`,
                    userAgent: navigator.userAgent,
                });
            } catch (emailError) {
                console.warn("Failed to send login notification email:", emailError);
            }
        } catch (err: any) {
            console.error("Google login error:", err);
            const errorMsg = err.response?.data?.error || err.response?.data?.details || "Google login failed. Please try again.";
            const errorDetails = err.response?.data?.details || "";
            alert(`${errorMsg}${errorDetails ? '\n\nDetails: ' + errorDetails : ''}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await backendApi.post("/api/v1/auth/login", form);

            const accessToken = response.data.accessToken;
            const refreshToken = response.data.refreshToken;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);

            const user: UserData = getUserFromToken(accessToken);

            localStorage.setItem('userName', user.name);
            localStorage.setItem('role', user.role);

            const userAgent = navigator.userAgent;
            const loginTime = new Date().toLocaleString();


            if (user.role === 'customer' || user.role === 'driver') {
                alert("Login successful.");
                navigate("/home");
            } else if (user.role === 'admin') {
                alert("Login successful.");
                navigate("/dashboard");
            }

            try {
                await backendApi.post("/api/v1/email/send-login-notification", {
                    to: user.email,
                    subject: "Login Alert",
                    message: `Successful login detected for your account (${user.name}) at ${loginTime}.`,
                    userAgent: userAgent,
                });
            } catch (emailError) {
                console.warn("Failed to send login notification email:", emailError);
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-bg-dark">
            {/* Dynamic Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] animate-pulse"
                    style={{ backgroundColor: '#4F9CF9' }}
                ></div>
                <div
                    className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] animate-pulse"
                    style={{ backgroundColor: '#22C55E' }}
                ></div>
                
                {/* Additional Floating Orbs */}
                <div
                    className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-[100px] animate-pulse"
                    style={{ backgroundColor: '#4F9CF9', animationDuration: '8s' }}
                ></div>
                <div
                    className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full opacity-15 blur-[80px] animate-pulse"
                    style={{ backgroundColor: '#22C55E', animationDuration: '6s', animationDelay: '2s' }}
                ></div>
            </div>

            {/* Left Side - Hero Section */}
            <div
                className={`hidden lg:flex lg:w-1/2 relative overflow-hidden transition-all duration-1000 bg-card-dark ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
            >
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Grid Pattern */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4F9CF9 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    
                    {/* Floating Geometric Shapes */}
                    <div className="absolute top-20 right-20 w-32 h-32 opacity-10">
                        <svg viewBox="0 0 100 100" className="w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
                            <polygon points="50,10 90,90 10,90" fill="#4F9CF9" />
                        </svg>
                    </div>
                    <div className="absolute bottom-32 left-32 w-24 h-24 opacity-10">
                        <svg viewBox="0 0 100 100" className="w-full h-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                            <circle cx="50" cy="50" r="40" fill="#22C55E" />
                        </svg>
                    </div>
                    
                    {/* Map Pin Illustration */}
                    <div className="absolute top-1/3 right-10 w-20 h-20 opacity-5">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <path d="M50 10 C30 10, 15 25, 15 45 C15 65, 50 90, 50 90 C50 90, 85 65, 85 45 C85 25, 70 10, 50 10 Z" fill="#4F9CF9" />
                            <circle cx="50" cy="45" r="15" fill="#22C55E" />
                        </svg>
                    </div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-center px-20 py-12 w-full">
                    {/* Brand */}
                    <div className={`mb-16 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary shadow-[0_0_20px_rgba(79,156,249,0.3)] transition-transform hover:scale-110 hover:rotate-6">
                                <FaCar className="text-white text-2xl" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-text-light">RideHub</h1>
                        </div>
                        <h2 className="text-6xl font-extrabold mb-6 leading-tight text-text-light">
                            Elevate Your <span className="text-primary">Journey</span>
                        </h2>
                        <p className="text-xl text-text-muted max-w-md leading-relaxed">
                            Experience the next generation of transportation. Seamless, smart, and designed for you.
                        </p>
                    </div>

                    {/* Hero Illustration */}
                    <div className={`mb-12 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                        <div className="relative">
                            {/* Main Car Illustration */}
                            <svg 
                                viewBox="0 0 600 400" 
                                className="w-full h-auto max-w-lg mx-auto"
                                style={{ filter: 'drop-shadow(0 20px 40px rgba(79, 156, 249, 0.2))' }}
                            >
                                {/* Road */}
                                <path 
                                    d="M0 300 Q150 280 300 300 T600 300 L600 400 L0 400 Z" 
                                    fill="url(#roadGradient)" 
                                    opacity="0.3"
                                />
                                
                                {/* Car Body */}
                                <g transform="translate(150, 200)">
                                    {/* Car Shadow */}
                                    <ellipse cx="150" cy="80" rx="120" ry="20" fill="#000" opacity="0.2" />
                                    
                                    {/* Car Main Body */}
                                    <path 
                                        d="M50 60 L50 40 Q50 20 70 20 L130 20 Q150 20 150 40 L150 60 L250 60 L250 80 L230 80 L230 100 L70 100 L70 80 L50 80 Z" 
                                        fill="url(#carGradient)"
                                        className="animate-pulse"
                                    />
                                    
                                    {/* Car Windows */}
                                    <rect x="80" y="30" width="50" height="30" rx="5" fill="#0B0F19" opacity="0.6" />
                                    <rect x="150" y="30" width="50" height="30" rx="5" fill="#0B0F19" opacity="0.6" />
                                    
                                    {/* Wheels */}
                                    <circle cx="90" cy="80" r="20" fill="#1F2937" />
                                    <circle cx="90" cy="80" r="12" fill="#0B0F19" />
                                    <circle cx="210" cy="80" r="20" fill="#1F2937" />
                                    <circle cx="210" cy="80" r="12" fill="#0B0F19" />
                                    
                                    {/* Headlights */}
                                    <circle cx="50" cy="50" r="8" fill="#FACC15" opacity="0.8" />
                                    <circle cx="50" cy="50" r="4" fill="#FFF" />
                                    
                                    {/* Accent Lines */}
                                    <path d="M70 50 L130 50" stroke="#4F9CF9" strokeWidth="2" opacity="0.5" />
                                    <path d="M150 50 L210 50" stroke="#4F9CF9" strokeWidth="2" opacity="0.5" />
                                </g>
                                
                                {/* Floating Elements */}
                                <circle cx="100" cy="100" r="4" fill="#4F9CF9" opacity="0.6" className="animate-pulse" />
                                <circle cx="500" cy="150" r="6" fill="#22C55E" opacity="0.5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                                <circle cx="80" cy="250" r="5" fill="#4F9CF9" opacity="0.4" className="animate-pulse" style={{ animationDelay: '1s' }} />
                                
                                {/* Gradients */}
                                <defs>
                                    <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#4F9CF9" />
                                        <stop offset="100%" stopColor="#3B82F6" />
                                    </linearGradient>
                                    <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#4F9CF9" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0.1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-8">
                        {[
                            { icon: FaCar, title: "Premium Fleet", desc: "Arrive in style with our curated vehicle selection.", color: "primary" },
                            { icon: FaMapMarkerAlt, title: "Smart Routing", desc: "Get where you're going faster with AI navigation.", color: "accent" },
                            { icon: FaClock, title: "On-Time Guarantee", desc: "Your time matters. We're never a minute late.", color: "primary" }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                                style={{ transitionDelay: `${300 + i * 100}ms` }}
                            >
                                <div 
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group transition-all duration-300 hover:scale-110"
                                    style={{ 
                                        backgroundColor: feature.color === 'primary' ? 'rgba(79, 156, 249, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                        border: `1px solid ${feature.color === 'primary' ? 'rgba(79, 156, 249, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                                    }}
                                >
                                    <feature.icon 
                                        className="text-2xl transition-transform group-hover:scale-110" 
                                        style={{ color: feature.color === 'primary' ? '#4F9CF9' : '#22C55E' }}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1 text-text-light">{feature.title}</h3>
                                    <p className="text-text-muted leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Graphic */}
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-bg-dark/50 to-transparent pointer-events-none"></div>
            </div>

            {/* Right Side - Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-8 relative z-10">
                <div className={`w-full max-w-md transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary">
                                <FaCar className="text-white text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-text-light">RideHub</span>
                        </div>
                        <h2 className="text-4xl font-bold text-text-light mb-3">Welcome Back</h2>
                        <p className="text-text-muted">Sign in to manage your rides and fleet</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-card-dark/80 backdrop-blur-xl rounded-[2rem] border border-border-dark p-10 shadow-2xl relative overflow-hidden group">
                        {/* Subtle inner highlight */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
                        
                        {/* Decorative Background Pattern */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4F9CF9" strokeWidth="0.5"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        </div>
                        
                        {/* Floating Icon Decorations */}
                        <div className="absolute top-4 right-4 w-16 h-16 opacity-10 pointer-events-none">
                            <FaCar className="w-full h-full text-primary animate-pulse" style={{ animationDuration: '3s' }} />
                        </div>
                        <div className="absolute bottom-4 left-4 w-12 h-12 opacity-10 pointer-events-none">
                            <FaMapMarkerAlt className="w-full h-full text-accent animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                        </div>

                        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Email Address</label>
                                <div className="relative group">
                                    <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-muted group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="name@company.com"
                                        className="w-full bg-bg-dark/50 border border-border-dark rounded-xl py-4 pl-12 pr-4 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-text-muted/50"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-semibold text-text-muted uppercase tracking-wider">Password</label>
                                    <Link to="/forgot-password" title="Forgot Password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Forgot?</Link>
                                </div>
                                <div className="relative group">
                                    <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-muted group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-bg-dark/50 border border-border-dark rounded-xl py-4 pl-12 pr-12 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-text-muted/50"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light transition-colors"
                                    >
                                        {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Sign In to RideHub</span>
                                        <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-8">
                                <div className="h-px flex-1 bg-border-dark"></div>
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">OR</span>
                                <div className="h-px flex-1 bg-border-dark"></div>
                            </div>

                            {/* Google */}
                            <div className="google-auth-wrapper">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => alert('Google login failed')}
                                    theme="filled_blue"
                                    size="large"
                                    shape="circle"
                                    width="100%"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <p className="text-center mt-8 text-text-muted">
                        New to RideHub? <Link to="/register" className="text-primary font-bold hover:underline transition-all">Create an account</Link>
                    </p>
                </div>
            </div>

            <style>{`
                .google-auth-wrapper > div {
                    display: flex !important;
                    justify-content: center !important;
                    width: 100% !important;
                }
                iframe {
                    border-radius: 12px !important;
                    overflow: hidden !important;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                @keyframes drift {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(30px, -30px) rotate(120deg); }
                    66% { transform: translate(-20px, 20px) rotate(240deg); }
                }
                .floating-shape {
                    animation: drift 20s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
