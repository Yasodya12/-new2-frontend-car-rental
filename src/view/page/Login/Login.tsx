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
        <div className="min-h-screen flex items-stretch bg-[#FDFDFF] overflow-hidden text-left font-sans">
            {/* Left Side: High-Fidelity Logistics Intelligence Hero */}
            <div className={`hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 overflow-hidden transition-all duration-1000 bg-[#0B0F1A] ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                {/* Deep Background Layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F1A] via-[#0F172A] to-[#1E293B]"></div>

                {/* 1. Fleet Intelligence Topology (The "Map" Effect) */}
                <div className="absolute inset-0 opacity-[0.15] mix-blend-screen pointer-events-none">
                    <svg viewBox="0 0 800 600" className="w-full h-full">
                        {/* Topology Lines - Global Connectivity */}
                        <path d="M100 200 L300 150 L500 250 L700 180 M200 400 L400 350 L600 450 M150 500 L450 480"
                            stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                        {/* Interactive Nodes */}
                        {[[100, 200], [300, 150], [500, 250], [700, 180], [200, 400], [400, 350], [600, 450], [450, 480]].map(([x, y], i) => (
                            <circle key={i} cx={x} cy={y} r="3" fill="#3B82F6" className="animate-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
                        ))}
                    </svg>
                </div>

                {/* 2. Precision Data Grid Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
                ></div>

                {/* 3. Hero Content & Structured Product Previews */}
                <div className="relative z-10 w-full max-w-2xl">
                    <div className="px-12 mb-20">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-1 ring-white/10">
                                <FaCar className="text-white text-2xl" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight text-white">RideHub<span className="text-blue-500">.</span></span>
                        </div>

                        <h2 className="text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-8 tracking-tighter">
                            Modern logs for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">global networks.</span>
                        </h2>
                        <p className="text-xl text-gray-400 font-medium max-w-lg leading-relaxed">
                            The enterprise platform for fleet management, real-time logistics tracking, and operational intelligence.
                        </p>
                    </div>

                    {/* 4. "Fleet OS" Product Snapshot (Perspective Cards) */}
                    <div className="relative h-64 mx-12">
                        {/* Card: Active Trips Metrics */}
                        <div className="absolute top-0 left-0 w-64 p-6 bg-white shadow-3xl rounded-3xl border border-gray-100 z-30 transition-all hover:-translate-y-2 hover:scale-[1.02] duration-500">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><FaMapMarkerAlt className="text-xl" /></div>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full">+12.4%</span>
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Shipments</p>
                            <h4 className="text-3xl font-bold text-gray-900 tracking-tight">2,814</h4>
                            <div className="mt-5 flex gap-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div className="w-1/2 bg-blue-600 rounded-full"></div>
                                <div className="w-1/4 bg-emerald-500 rounded-full"></div>
                            </div>
                        </div>

                        {/* Card: Network Efficiency Dashboard */}
                        <div className="absolute top-10 left-44 w-72 p-8 bg-[#1E293B]/80 backdrop-blur-3xl shadow-3xl rounded-[2.5rem] border border-white/10 z-20 transition-all hover:-translate-y-2 hover:scale-[1.02] duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Network Health</p>
                                    <p className="text-xl font-bold text-white tracking-tight">Optimal Operations</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest"><span>Fleet Load</span><span>98%</span></div>
                                    <div className="w-full h-1 bg-white/5 rounded-full"><div className="w-[98%] h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div></div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest"><span>Driver Active</span><span>85%</span></div>
                                    <div className="w-full h-1 bg-white/5 rounded-full"><div className="w-[85%] h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div></div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Micro-Metric */}
                        <div className="absolute top-48 left-16 p-5 bg-white rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4 z-40 animate-bounce-slow">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <FaClock />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AVG Turnaround</p>
                                <p className="text-xl font-bold text-gray-900">4.2m</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Immersive Shadow Gradients */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0B0F1A] to-transparent pointer-events-none"></div>
            </div>

            {/* Right Side: High-End Auth Section */}
            <div className={`w-full lg:w-[45%] flex flex-col items-center justify-center px-8 lg:px-24 relative transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-12 text-center lg:text-left">
                        <h3 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Welcome back</h3>
                        <p className="text-gray-500 font-medium text-lg">Enter your credentials to access the platform.</p>
                    </div>

                    {/* Login Card (Light Glass) */}
                    <div className="bg-white rounded-[2.5rem] p-2 shadow-[0_30px_60px_rgba(0,0,0,0.04)] border border-gray-100">
                        <div className="p-10 lg:p-12">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Email Field */}
                                <div className="space-y-2 text-left">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Corporate Email</label>
                                    <div className="group relative">
                                        <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="janedoe@ridehub.com"
                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4.5 pl-12 pr-4 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold placeholder:text-gray-300"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2 text-left">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                                        <Link to="/forgot-password" title="Forgot Password" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">Recover?</Link>
                                    </div>
                                    <div className="group relative">
                                        <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4.5 pl-12 pr-12 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-semibold placeholder:text-gray-300"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <HiEyeOff size={22} /> : <HiEye size={22} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Login Action */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gray-900 hover:bg-black text-white py-4.5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 group active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>Sign in to Platform</span>
                                            <HiArrowRight className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Social Divider */}
                            <div className="flex items-center gap-6 my-10">
                                <div className="h-px flex-1 bg-gray-100"></div>
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">OR</span>
                                <div className="h-px flex-1 bg-gray-100"></div>
                            </div>

                            {/* Google Auth Integration */}
                            <div className="google-auth-wrapper">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => alert('Google login failed')}
                                    theme="outline"
                                    size="large"
                                    shape="pill"
                                    width="100%"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Page Footer Links */}
                    <div className="mt-12 text-center text-sm">
                        <span className="text-gray-400 font-medium">New around here?</span>{' '}
                        <Link to="/register" className="text-blue-600 font-bold hover:underline transition-all underline-offset-4 decoration-2">Create an account</Link>
                    </div>
                </div>

                {/* Global Legal Meta */}
                <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-center lg:justify-start lg:px-24 text-[10px] font-bold text-gray-300 uppercase tracking-[0.25em] gap-8">
                    <button className="hover:text-gray-500 transition-colors">Privacy Policy</button>
                    <button className="hover:text-gray-500 transition-colors">Terms of Use</button>
                    <button className="hidden lg:block hover:text-gray-500 transition-colors">RideHub Fleet v5.0.2</button>
                </div>
            </div>

            <style>{`
                .google-auth-wrapper > div {
                    display: flex !important;
                    justify-content: center !important;
                    width: 100% !important;
                }
                iframe {
                    border-radius: 16px !important;
                    overflow: hidden !important;
                    border: 1px solid #E5E7EB !important;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
